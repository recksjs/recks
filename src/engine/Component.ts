import { combineLatest, EMPTY, from, isObservable, Observable, of, ReplaySubject, Subject } from 'rxjs';
import { filter, map, pairwise, startWith, switchMap, take, takeUntil } from 'rxjs/operators';
import { DynamicEntry, IDynamicEntry } from './DynamicEntry';
import { IElement, IProps } from './Element';


// A component listen to definition updates
// and maps that to self updates and children updates

export type IChild = null | number | string | IElement<any> | Array<IElement<any>> | Observable<any>;

interface IBasicComponent {
    update$: Subject<IChild>;
    destroy$: Subject<void>;
}

export type IComponent = ILeafComponent | IStaticComponent | IObservableComponent | IFnComponent | IArrayComponent;

export const createComponent = (child: IChild): IComponent => {
    if (child == null || typeof child == 'number' || typeof child == 'string') {
        return createLeafComponent(<LeafComponentValueType>child);
    } else if (isObservable(child)) {
        return createObservableComponent();
    } else if (typeof (child as any).then == 'function') {
        return createObservableComponent();
    } else if (Array.isArray(child)) {
        return createArrayComponent();
    } else if (typeof child.type == 'string') {
        return createStaticComponent(child);
    } else if (typeof child.type == 'function') {
        return createFnComponent(child);
    }

    throw 'Unknown child';
}

// LEAF COMPONENT {{{
interface ILeafComponent extends IBasicComponent {
    type: 'leaf';
    data: LeafComponentValueType;
    render$: Observable<LeafComponentValueType>;
}

type LeafComponentValueType = string | number | null;

function createLeafComponent(child: LeafComponentValueType): ILeafComponent {
    const update$ = new Subject<LeafComponentValueType>();
    const destroy$ = new Subject<void>();
    const render$ = new ReplaySubject<LeafComponentValueType>(1);

    update$.pipe(
        takeUntil(destroy$)
    )
        .subscribe(render$);

    return {
        type: 'leaf',
        data: child,
        render$: render$.asObservable(),
        update$,
        destroy$
    }
}
// }}}


// STATIC COMPONENT {{{
interface IStaticComponent extends IBasicComponent {
    type: 'static';
    definition: IElement<string>;
    dynamicChildren: IDynamicEntry[];
    element$: Subject<HTMLElement>;
    change$: Observable<IProps>;
}

const createStaticComponent = (element) : IStaticComponent => {
    const update$ = new ReplaySubject<IElement<string>>(1);
    const destroy$ = new Subject<void>();
    const element$ = new Subject<HTMLElement>();

    const dynamicChildren = element.props.children
        .map(() => DynamicEntry());

    destroy$.pipe(
        take(1)
    ).subscribe(()=>{
        dynamicChildren.forEach(child => child.destroy$.next(void 0))
        element$.complete();
    });

    dynamicChildren.forEach((child, i) => {
        update$.pipe(
            map(update => update.props.children[i]),
            takeUntil(destroy$)
        ).subscribe(child.update$)
    })

    combineLatest(
        update$.pipe(
            map(definition => definition.props.ref),
            filter(x => !!x)
        ),
        element$
    ).pipe(
        takeUntil(destroy$)
    ).subscribe(([ref, element]) => {
        ref.next(element);
    });

    const change$ = update$.pipe(
        map(definition => definition.props),
        takeUntil(destroy$)
    )

    return {
        type: 'static',
        update$,
        element$,
        definition: element,
        dynamicChildren,
        change$,
        destroy$,
    }
}
// }}}

// OBSERVABLE COMPONENT {{{
interface IObservableComponent extends IBasicComponent {
    type: 'observable';
    result$: Observable<IComponent>;
}

function createObservableComponent() : IObservableComponent {
    const update$ = new Subject<Observable<IChild>>();
    const destroy$ = new Subject<void>();
    const dynamicChild = DynamicEntry();

    destroy$.pipe(
        take(1)
    )
    .subscribe(dynamicChild.destroy$)

    update$
        .pipe(
            switchMap(a => a),
            takeUntil(destroy$)
        )
        .subscribe(result => {
            dynamicChild.update$.next(result);
        });

    return {
        type: 'observable',
        update$,
        destroy$,
        result$: dynamicChild.result$
    }
}
// }}}


// FN COMPONENT {{{
interface IFnComponent extends IBasicComponent {
    type: 'fn',
    result$: Observable<IComponent>,
}

function createFnComponent(definition): IFnComponent {
    const update$ = new Subject<IElement<Function>>();
    const destroy$ = new Subject<void>();

    const props$ = update$.pipe(
        map(update => update.props),
        takeUntil(destroy$),
    );

    const dynamicRoot = DynamicEntry();

    destroy$.pipe(
        take(1)
    ).subscribe(dynamicRoot.destroy$);

    const result = definition.type(props$, { destroy$: destroy$.pipe(take(1)) });

    asObservable(result)
        .pipe(
            takeUntil(destroy$)
        )
        .subscribe(dynamicRoot.update$);

    return {
        type: 'fn',
        update$,
        destroy$,
        result$: dynamicRoot.result$,
    };
}

function asObservable(value) : Observable<unknown> {
    if (isObservable(value)) {
        return value;
    }

    // basically RxJS way of checking against Promise
    // https://github.com/ReactiveX/rxjs/blob/8ad3267fb337a22c383a4ff8901e03b0ae3e2a7a/src/internal/util/isPromise.ts
    if (value && typeof value.then == 'function') {
        return from(value);
    }

    // TODO: check if the value can be rendered
    // (is an Element or a basic type)
    // throw otherwise
    return of(value);
}
// }}}


// ARRAY COMPONENT {{{
interface IArrayComponent extends IBasicComponent {
    type: 'array',
    items$: Observable<{ key: string|number; component: IComponent }[]>;
}

function createArrayComponent () : IArrayComponent {
    const update$ = new Subject<IElement<any>[]>();
    const destroy$ = new Subject<void>();
    const items$ = new ReplaySubject<{ key: string|number; component: IComponent }[]>(1);

    const dynamicEntries = new Map();

    destroy$.pipe(
        take(1)
    ).subscribe(()=>{
        for (let value of dynamicEntries.values()) {
            value.destroy$.next(void 0);
        }
    });

    update$.pipe(
        startWith(null),
        pairwise(),
        switchMap(([prev, curr])=> {
            // NOTE: this code block is similar to Array Rendering logic
            // TODO: refactor

            // shortcut
            // if curr array is empty -- just return empty array
            if (curr.length == 0) {
                dynamicEntries.clear();
                return of([]);
            }

            // shortcut
            // if all elements (keys) are the same -- just push an update to them
            if (prev && prev.length == curr.length && prev.every((p, i) => p.props.key == curr[i].props.key)) {
                curr.forEach(definition => {
                    const key = definition.props.key;
                    if (key == null) { throw 'Key should be defined' }
                    dynamicEntries.get(key).update$.next(definition);
                });
                return EMPTY;
            }

            // removing obsolete keys
            if (prev && prev.length != 0) {
                for (let prevIndex = 0; prevIndex < prev.length; prevIndex++) {
                    let shouldRemove = true;
                    const prevKey = prev[prevIndex].props.key;

                    for (let currKey = 0; currKey < curr.length; currKey++) {
                        if (prevKey == curr[currKey].props.key) {
                            shouldRemove = false;
                            break;
                        }
                    }

                    if (shouldRemove) {
                        const dynamicEntry = dynamicEntries.get(prevKey);
                        dynamicEntry.destroy$.next(void 0);
                        dynamicEntries.delete(prevKey);
                    }
                }
            }

            return combineLatest(
                ...curr.map(definition => {
                    const key = definition.props.key;
                    if (key == null || (typeof key !== 'string' && typeof key !== 'number')) {
                        console.error(key);
                        throw 'Key should be string or number';
                    }

                    if (!dynamicEntries.has(key)) {
                        dynamicEntries.set(key, DynamicEntry());
                    }

                    const dynamicEntry = dynamicEntries.get(key);
                    dynamicEntry.update$.next(definition);
                    return dynamicEntry.result$.pipe(
                        map(component => ({ key, component }))
                    );
                })
            )
        }),
        takeUntil(destroy$),
    ).subscribe(items$)

    return {
        type: 'array',
        items$:  items$.asObservable(),
        update$,
        destroy$
    }
}
// }}}
