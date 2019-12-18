import { combineLatest, from, isObservable, Observable, of, ReplaySubject, Subject, Subscription } from 'rxjs';
import { distinctUntilChanged, map, switchMap, take, takeUntil } from 'rxjs/operators';
import { DynamicEntry } from '../DynamicEntry';
import { IElement } from '../Element';
import { IBasicComponent, IComponent } from './index';


export interface IFnComponent extends IBasicComponent {
    type: 'fn',
    result$: Observable<IComponent>,
}

export function createFnComponent(definition): IFnComponent {
    const update$ = new Subject<IElement<Function>>();
    const destroy$ = new Subject<void>();

    const props$ = update$.pipe(
        map(update => update.props),
        source$ => new Observable(observer => {
            const propsStreamsMap = new Map<string, IDynamicProp>();
            let currSubscription: Subscription;

            const subscription = source$.subscribe({
                next(props) {
                    if (currSubscription){
                        currSubscription.unsubscribe();
                        subscription.remove(currSubscription);
                    }

                    const newProps = new Map(Object.entries(props));
                    for(let [newKey, newValue] of newProps) {
                        if (!propsStreamsMap.has(newKey)) {
                            const dynamicProp = DynamicProp();
                            propsStreamsMap.set(newKey, dynamicProp);
                            subscription.add(dynamicProp.subscription);
                        }

                        propsStreamsMap.get(newKey).update$.next(newValue);
                    }

                    for (let [oldKey, oldValue] of propsStreamsMap) {
                        if (newProps.has(oldKey)) {
                            continue;
                        }

                        oldValue.destroy$.next(void 0);
                        subscription.remove(oldValue.subscription);
                        propsStreamsMap.delete(oldKey);
                    }

                    const propKeys = [...propsStreamsMap.keys()];
                    const propDynamicProps = propsStreamsMap.values();
                    currSubscription = combineLatest(
                        ...[...propDynamicProps].map(p => p.result$),
                        (...values: any[]) => {
                            return values.reduce((acc, curr, i) => {
                                acc[propKeys[i]] = curr;
                                return acc;
                            }, {})
                        }
                    )
                        .subscribe({
                            next: observer.next
                        });

                    subscription.add(currSubscription);
                },
                error: observer.error,
                complete: observer.complete
            })

            return subscription;
        }),
        takeUntil(destroy$),
    );

    const dynamicRoot = DynamicEntry();

    const destroyTake1$ = destroy$.pipe(take(1));
    destroyTake1$
        .subscribe(dynamicRoot.destroy$);

    const result = definition.type(props$, { destroy$: destroyTake1$ });

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

interface IDynamicProp {
    subscription: Subscription;
    update$: Subject<any>;
    result$: Observable<any>;
    destroy$: Subject<void>;
}

function DynamicProp () : IDynamicProp {
    const update$ = new Subject();
    const destroy$ = new Subject<void>();
    const result$ = new ReplaySubject(1);

    const subscription = update$.pipe(
        distinctUntilChanged(),
        switchMap(x => isObservable(x) ? x : of(x)),
        takeUntil(destroy$)
    ).subscribe({
        next: result$.next
    });

    return {
        subscription,
        update$,
        result$,
        destroy$,
    }
}