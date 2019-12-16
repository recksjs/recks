import { Observable, Subject } from 'rxjs';
import { switchMap, take, takeUntil } from 'rxjs/operators';
import { DynamicEntry } from '../DynamicEntry';
import { IBasicComponent, IComponent, IChild } from './index';


export interface IObservableComponent extends IBasicComponent {
    type: 'observable';
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