import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { createComponent, IComponent } from '..';
import { destroyer } from '../../../helpers/destroyer';
import { isElement } from '../../Element';
import { IChild } from '../../IChild';
import { getType } from '../helpers';

export interface IDynamicEntry {
    update$: Subject<IChild>;
    destroy: () => void;
    result$: Observable<IComponent>;
}

const NULL_CHILD_STUB = Object.create(null) as IChild;

export const DynamicEntry = ():IDynamicEntry => {
    const update$ = new Subject<IChild>();
    const [destroy, destroy$] = destroyer();

    let component: IComponent;
    let prev = NULL_CHILD_STUB;

    destroy$.subscribe(() => {
        if (component) {
            component.destroy();
        }
    });

    const result$ = new Observable<IComponent>(observer => {

        return update$.pipe(takeUntil(destroy$)).subscribe({
            next(curr) {
                console.log('DYNAMIC ENTRY UPD', curr);

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
                            prev.props.children.length !== curr.props.children.length))
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
            complete() { observer.complete() },
            error(err) { observer.error(err) },
        });
    });

    return {
        update$,
        result$,
        destroy,
    };
};
