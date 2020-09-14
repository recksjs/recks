import { Observable, ReplaySubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { createComponent, IComponent } from '..';
import { createDestroyer } from '../../../helpers/destroyer';
import { isElement } from '../../Element';
import { IChild } from '../../IChild';
import { getType } from '../helpers';

export interface IDynamicEntry {
    update$: ReplaySubject<IChild>;
    destroy: () => void;
    result$: Observable<IComponent>;
}

const NULL_CHILD_STUB = Object.create(null) as IChild;

export const DynamicEntry = (): IDynamicEntry => {
    // NOTE: on using ReplaySubject instead of Subject here and in components:
    // when rendering an array of elements we use combineLatest, which waits
    // till all elements components to emit. Therefore rendering of subelements
    // would be delayed, which means that we subscribe to sub-components after
    // we subscribe to higher dynamic elements (later triger pushing updates to
    // to former).
    // This brings some issues:
    // If we use ReplaySubject(1) -- then we might miss some updates. If client
    // code in Fn will subscribe to props$ w/ a delay -- they will receive all
    // previous updates.
    const update$ = new ReplaySubject<IChild>(1);
    const [destroy, destroy$] = createDestroyer();

    let component: IComponent;
    let prev = NULL_CHILD_STUB;

    destroy$.subscribe(() => {
        if (component) {
            component.destroy();
        }
    });

    const result$ = new Observable<IComponent>((observer) => {
        return update$.pipe(takeUntil(destroy$)).subscribe({
            next(curr) {
                // create a new component if:
                // - there were no prev value
                // - different data types of children
                // - different types of elements (leaf / array / static / observable / fn)
                // - keys mismatch
                // - xmlns mismatch
                // - number of children mismatch
                if (
                    prev === NULL_CHILD_STUB ||
                    getType(prev) != getType(curr) ||
                    (isElement(curr) &&
                        isElement(prev) &&
                        (prev.type !== curr.type ||
                            !Object.is(prev.props.key, curr.props.key) ||
                            !Object.is(prev.props.xmlns, curr.props.xmlns) ||
                            prev.props.children.length !==
                                curr.props.children.length))
                ) {
                    if (component) {
                        component.destroy();
                    }

                    component = createComponent(curr);
                    observer.next(component);
                }

                component.update$.next(curr);
                prev = curr;
            },
            complete() {
                observer.complete();
            },
            error(err) {
                observer.error(err);
            },
        });
    });

    return {
        update$,
        result$,
        destroy,
    };
};
