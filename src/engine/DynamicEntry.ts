import { Subject, ReplaySubject } from 'rxjs';
import { takeUntil, take, startWith, pairwise } from 'rxjs/operators';
import { isElement } from './Element';
import { IChild, createComponent, IComponent } from './Component';

export interface IDynamicEntry {
    update$: Subject<IChild>;
    destroy$: Subject<void>;
    result$: Subject<IComponent>;
}

const PREV_CHILD_STUB = Object.create(null) as IChild;

export const DynamicEntry = () => {
    const update$ = new Subject<IChild>();
    const result$ = new ReplaySubject<IComponent>(1);
    const destroy$ = new Subject<void>();

    let component: IComponent;
    let prev = PREV_CHILD_STUB;

    destroy$.pipe(
        take(1)
    ).subscribe(() => {
        if (component) {
            component.destroy$.next(void 0);
        }
    });

    update$.pipe(
        takeUntil(destroy$),
    )
    .subscribe(curr => {
        // create a new component if:
        // - there were no prev value
        // - different data types of children
        // - different types of elements (leaf / array / static / observable / fn)
        // - keys mismatch
        // - number of children mismatch
        if (prev === PREV_CHILD_STUB
            || typeof prev != typeof curr
            || (isElement(curr) && isElement(prev) && (
                    prev.type !== curr.type
                    || !Object.is(prev.props.key, curr.props.key)
                    || prev.props.children.length !== curr.props.children.length
                )
            )
        ) {
            if (component) {
                component.destroy$.next(void 0);
            }

            component = createComponent(curr);
            result$.next(component);
        }

        component.update$.next(curr);
        prev = curr;
    });

    return {
        update$,
        result$: result$.pipe(takeUntil(destroy$)),
        destroy$
    };
};
