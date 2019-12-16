import { from, isObservable, Observable, of, Subject } from 'rxjs';
import { map, take, takeUntil } from 'rxjs/operators';
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