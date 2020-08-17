import {
    combineLatest,
    EMPTY,
    Observable,
    of,
    ReplaySubject,
    Subject,
} from 'rxjs';
import {
    map,
    pairwise,
    startWith,
    switchMap,
    take,
    takeUntil,
} from 'rxjs/operators';
import { DynamicEntry } from '../DynamicEntry';
import { IElement } from '../Element';
import { IBasicComponent, IComponent } from './index';
import { ComponentType } from './helpers';

export interface IArrayComponent extends IBasicComponent {
    type: ComponentType.array;
    items$: Observable<{ key: string | number; component: IComponent }[]>;
}

export function createArrayComponent(): IArrayComponent {
    const update$ = new Subject<IElement<any>[]>();
    const destroy$ = new Subject<void>();
    const items$ = new ReplaySubject<
        { key: string | number; component: IComponent }[]
    >(1);

    const dynamicEntries = new Map();

    destroy$.pipe(take(1)).subscribe(() => {
        for (let value of dynamicEntries.values()) {
            value.destroy$.next(void 0);
        }
    });

    update$
        .pipe(
            startWith(null),
            pairwise(),
            switchMap(([prev, curr]) => {
                // NOTE: this code block is similar to Array Rendering logic
                // TODO: refactor

                // shortcut
                // if curr array is empty -- just return empty array
                if (curr.length == 0) {
                    dynamicEntries.clear();
                    return of([]);
                }

                // shortcut
                // if all elements (keys) are the same -- just push an update to them
                if (
                    prev &&
                    prev.length == curr.length &&
                    prev.every((p, i) => p.props.key == curr[i].props.key)
                ) {
                    curr.forEach((definition) => {
                        const key = definition.props.key;
                        if (key == null) {
                            throw 'Key should be defined';
                        }
                        dynamicEntries.get(key).update$.next(definition);
                    });
                    return EMPTY;
                }

                // removing obsolete keys
                if (prev && prev.length != 0) {
                    for (
                        let prevIndex = 0;
                        prevIndex < prev.length;
                        prevIndex++
                    ) {
                        let shouldRemove = true;
                        const prevKey = prev[prevIndex].props.key;

                        for (
                            let currKey = 0;
                            currKey < curr.length;
                            currKey++
                        ) {
                            if (prevKey == curr[currKey].props.key) {
                                shouldRemove = false;
                                break;
                            }
                        }

                        if (shouldRemove) {
                            const dynamicEntry = dynamicEntries.get(prevKey);
                            dynamicEntry.destroy$.next(void 0);
                            dynamicEntries.delete(prevKey);
                        }
                    }
                }

                return combineLatest(
                    ...curr.map((definition) => {
                        const key = definition.props.key;
                        if (
                            key == null ||
                            (typeof key !== 'string' && typeof key !== 'number')
                        ) {
                            console.error(key);
                            throw 'Key should be string or number';
                        }

                        if (!dynamicEntries.has(key)) {
                            dynamicEntries.set(key, DynamicEntry());
                        }

                        const dynamicEntry = dynamicEntries.get(key);
                        dynamicEntry.update$.next(definition);
                        return dynamicEntry.result$.pipe(
                            map((component) => ({ key, component })),
                        );
                    }),
                );
            }),
            takeUntil(destroy$),
        )
        .subscribe(items$);

    return {
        type: ComponentType.array,
        items$: items$.asObservable(),
        update$,
        destroy$,
    };
}
