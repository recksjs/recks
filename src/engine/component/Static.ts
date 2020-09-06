import { combineLatest, Observable, ReplaySubject, Subject } from 'rxjs';
import { filter, map, take, takeUntil } from 'rxjs/operators';
import { DynamicEntry, IDynamicEntry } from '../DynamicEntry';
import { IElement, IProps } from '../Element';
import { ComponentType } from './helpers';
import { IBasicComponent } from './index';

export interface IStaticComponent extends IBasicComponent {
    type: ComponentType.static;
    definition: IElement<string>;
    dynamicChildren: IDynamicEntry[];
    element$: Subject<HTMLElement>;
    change$: Observable<IProps>;
}

export const createStaticComponent = (element): IStaticComponent => {
    const update$ = new ReplaySubject<IElement<string>>(1);
    const destroy$ = new Subject<void>();
    const element$ = new Subject<HTMLElement>();

    const dynamicChildren = element.props.children.map(() => DynamicEntry());

    destroy$.pipe(take(1)).subscribe(() => {
        dynamicChildren.forEach((child) => child.destroy$.next(void 0));
        element$.complete();
    });

    dynamicChildren.forEach((child, i) => {
        update$
            .pipe(
                map((update) => update.props.children[i]),
                takeUntil(destroy$),
            )
            .subscribe(child.update$);
    });

    combineLatest(
        update$.pipe(
            map((definition) => definition.props.ref),
            filter((x) => !!x),
        ),
        element$,
    )
        .pipe(takeUntil(destroy$))
        .subscribe(([ref, element]) => {
            ref.next(element);
        });

    const change$ = update$.pipe(
        map((definition) => definition.props),
        takeUntil(destroy$),
    );

    return {
        type: ComponentType.static,
        update$,
        element$,
        definition: element,
        dynamicChildren,
        change$,
        destroy$,
    };
};
