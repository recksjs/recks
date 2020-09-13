import { combineLatest, Observable, ReplaySubject, Subject } from 'rxjs';
import { map, pluck, takeUntil } from 'rxjs/operators';
import { createDestroyer } from '../../helpers/destroyer';
import { IElement, IProps } from '../Element';
import { DynamicEntry, IDynamicEntry } from './dynamic-entry/DynamicEntry';
import { ComponentType } from './helpers';
import { IBasicComponent } from './index';

export interface IStaticComponent extends IBasicComponent {
    type: ComponentType.static;
    definition: IElement<string>;
    dynamicChildren: IDynamicEntry[];
    element$: Subject<HTMLElement>;
    change$: Observable<IProps>;
}

export const createStaticComponent = (element: IElement<string>): IStaticComponent => {
    const update$ = new ReplaySubject<IElement<string>>(1);
    const [destroy, destroy$] = createDestroyer();
    const element$ = new ReplaySubject<HTMLElement>(1);

    const dynamicChildren = element.props.children.map(() => DynamicEntry());

    destroy$.subscribe(() => {
        dynamicChildren.forEach((child) => child.destroy());
        element$.complete();
    });

    const change$ = new Observable<IProps>(observer => {
        dynamicChildren.forEach((child, i) => {
            update$
                .pipe(
                    map((update) => update.props.children[i]),
                    takeUntil(destroy$),
                )
                .subscribe(child.update$);
        });

        // Ref handling
        // TODO: consider making ref a function instead of Subject
        combineLatest(
            update$.pipe(pluck('props', 'ref')),
            element$,
        )
            .pipe(takeUntil(destroy$))
            .subscribe(([ref, element]) => {
                if (!ref || typeof ref.next != 'function'){
                    return;
                }

                ref.next(element);
            });

        update$.pipe(
            pluck('props'),
            takeUntil(destroy$),
        ).subscribe(observer);
    });

    return {
        type: ComponentType.static,
        definition: element,
        // lifecycle
        update$,
        element$,
        destroy,
        // output
        change$,
        dynamicChildren,
    };
};
