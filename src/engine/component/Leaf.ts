import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { destroyer } from '../../helpers/destroyer';
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
    const update$ = new Subject<LeafComponentValueType>();
    const [destroy, destroy$] = destroyer();

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
