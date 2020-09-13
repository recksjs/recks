import { Observable, ReplaySubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { createDestroyer } from '../../helpers/destroyer';
import { ComponentType } from './helpers';
import { IBasicComponent } from './index';

export interface ILeafComponent extends IBasicComponent {
    type: ComponentType.leaf;
    data: LeafComponentValueType;
    render$: Observable<LeafComponentValueType>;
}

export type LeafComponentValueType = string | number | null;

export function createLeafComponent(
    child: LeafComponentValueType,
): ILeafComponent {
    const update$ = new ReplaySubject<LeafComponentValueType>(1);
    const [destroy, destroy$] = createDestroyer();

    const render$ = update$.pipe(takeUntil(destroy$));

    return {
        type: ComponentType.leaf,
        data: child,
        // lifecycle
        update$,
        destroy,
        // out
        render$,
    };
}
