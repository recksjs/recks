import { Observable, Subject } from 'rxjs';
import { switchMap, take, takeUntil } from 'rxjs/operators';
import { DynamicEntry } from '../DynamicEntry';
import { IBasicComponent, IComponent, IChild } from './index';
import { ComponentType } from './helpers';


export interface IObservableComponent extends IBasicComponent {
    type: ComponentType.observable;
    result$: Observable<IComponent>;
}

export function createObservableComponent() : IObservableComponent {
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
        .subscribe(dynamicChild.update$);

    return {
        type: ComponentType.observable,
        update$,
        destroy$,
        result$: dynamicChild.result$
    }
}