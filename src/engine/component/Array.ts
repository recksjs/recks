import { combineLatest, EMPTY, Observable, of, ReplaySubject } from 'rxjs';
import {
    distinctUntilChanged,
    map,
    pairwise,
    startWith,
    switchMap,
    takeUntil,
} from 'rxjs/operators';
import { createDestroyer } from '../../helpers/destroyer';
import { ElementKeyType, IElement } from '../Element';
import {
    IReplayDynamicEntry,
    ReplayDynamicEntry,
} from './dynamic-entry/ReplayDynamicEntry';
import { ComponentType } from './helpers';
import { IBasicComponent, IComponent } from './index';

interface Item {
    key: ElementKeyType;
    component: IComponent;
}

type Items = Item[];

export interface IArrayComponent extends IBasicComponent {
    type: ComponentType.array;
    items$: Observable<Items>;
}

export function createArrayComponent(): IArrayComponent {
    const update$ = new ReplaySubject<IElement<any>[]>(1);
    const [destroy, destroy$] = createDestroyer();

    const items$ = new Observable<Items>((observer) => {
        const dynamicEntries = new Map<ElementKeyType, IReplayDynamicEntry>();

        destroy$.subscribe(() => {
            for (let value of dynamicEntries.values()) {
                value.destroy();
            }
        });

        return update$
            .pipe(
                startWith(null),
                pairwise(),
                switchMap(([prev, curr]) => {
                    // NOTE: this code block is similar to Array Rendering logic
                    // TODO: refactor

                    // shortcut
                    // if curr array is empty -- just return empty array
                    if (curr.length == 0) {
                        for (let entry of dynamicEntries.values()) {
                            entry.destroy();
                        }
                        dynamicEntries.clear();
                        return of([]);
                    }

                    // shortcut
                    // if all elements (keys) are the same -- just push an update to them
                    // NOTE: prev.every might be costly
                    if (
                        prev &&
                        prev.length == curr.length &&
                        prev.every((p, i) =>
                            Object.is(p.props.key, curr[i].props.key),
                        )
                    ) {
                        curr.forEach((definition: IElement<any>) => {
                            const key = definition.props.key;
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
                                if (
                                    Object.is(prevKey, curr[currKey].props.key)
                                ) {
                                    shouldRemove = false;
                                    break;
                                }
                            }

                            if (shouldRemove) {
                                const dynamicEntry = dynamicEntries.get(
                                    prevKey,
                                );
                                dynamicEntry.destroy();
                                dynamicEntries.delete(prevKey);
                            }
                        }
                    }

                    const observableItems = curr.map((definition) => {
                        const key = definition.props.key;

                        if (
                            key == null ||
                            typeof key == 'object' ||
                            typeof key == 'function'
                        ) {
                            const err = new Error(
                                'Key should be string | number | bigint | boolean | Symbol',
                            );
                            // TODO: error only in dev mode
                            console.error(err);
                            throw err;
                        }

                        let dynamicEntry = dynamicEntries.get(key);

                        if (dynamicEntry == undefined) {
                            dynamicEntry = ReplayDynamicEntry();
                            dynamicEntries.set(key, dynamicEntry);
                        }

                        return new Observable<Item>((observer) => {
                            const subscription = dynamicEntry.result$
                                .pipe(
                                    distinctUntilChanged(),
                                    map((component) => ({ key, component })),
                                )
                                .subscribe(observer);

                            dynamicEntry.connect();

                            // this is pushed before arr child is rendered
                            dynamicEntry.update$.next(definition);

                            return subscription;
                        });
                    });

                    return combineLatest(...observableItems);
                }),
                takeUntil(destroy$),
            )
            .subscribe(observer);
    });

    return {
        type: ComponentType.array,
        // lifecycle
        update$,
        destroy,
        // out
        items$,
    };
}
