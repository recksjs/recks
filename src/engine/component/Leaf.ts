import { Observable, ReplaySubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { IBasicComponent } from './index';
import { ComponentType } from './helpers';


export interface ILeafComponent extends IBasicComponent {
    type: ComponentType.leaf;
    data: LeafComponentValueType;
    render$: Observable<LeafComponentValueType>;
}

export type LeafComponentValueType = string | number | null;

export function createLeafComponent(child: LeafComponentValueType): ILeafComponent {
    const update$ = new Subject<LeafComponentValueType>();
    const destroy$ = new Subject<void>();
    const render$ = new ReplaySubject<LeafComponentValueType>(1);

    update$.pipe(
        takeUntil(destroy$)
    )
        .subscribe(render$);

    return {
        type: ComponentType.leaf,
        data: child,
        render$: render$.asObservable(),
        update$,
        destroy$
    }
}