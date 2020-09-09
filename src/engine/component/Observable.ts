import { Observable, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { destroyer } from '../../helpers/destroyer';
import { IChild } from '../IChild';
import { DynamicEntry } from './dynamic-entry/DynamicEntry';
import { ComponentType } from './helpers';
import { IBasicComponent, IComponent } from './index';

export interface IObservableComponent extends IBasicComponent {
    type: ComponentType.observable;
    result$: Observable<IComponent>;
}

export function createObservableComponent(): IObservableComponent {
    const update$ = new Subject<Observable<IChild>>();
    const [destroy, destroy$] = destroyer();

    const dynamicChild = DynamicEntry();
    destroy$.subscribe(dynamicChild.destroy);

    const result$ = new Observable<IComponent>(observer => {
        dynamicChild.result$.subscribe(observer);

        update$
            .pipe(
                switchMap((o) => o),
                takeUntil(destroy$),
            )
            .subscribe(dynamicChild.update$);
    });

    return {
        type: ComponentType.observable,
        // lifecycle
        update$,
        destroy,
        // out
        result$,
    };
}
