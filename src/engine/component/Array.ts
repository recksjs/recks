import { combineLatest, EMPTY, Observable, of, ReplaySubject, Subject } from 'rxjs';
import { distinctUntilChanged, map, pairwise, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { destroyer } from '../../helpers/destroyer';
import { log } from '../../helpers/logPipe';
import { ElementKeyType, IElement } from '../Element';
import { IChild } from '../IChild';
import { DynamicEntry } from './dynamic-entry/DynamicEntry';
import { ComponentType } from './helpers';
import { IBasicComponent, IComponent } from './index';

interface Item {
    key: ElementKeyType;
    component: IComponent;
}

type Items = Item[];

// TODO: move out
const ReplayDynamicEntry = () => {
    const entry = DynamicEntry();
    const update$ = new Subject<IChild>();
    const result$ = new ReplaySubject<IComponent>(1);
    let connected = false;

    const connect = () => {
        if (connected) {
            return;
        }

        connected = true;
        entry.result$.subscribe(result$);
        update$.subscribe(entry.update$);
    }

    const destroy = () => {
        update$.complete();
        entry.destroy();
    }

    return {
        update$,
        result$,
        connect,
        destroy,
    }
}

export interface IArrayComponent extends IBasicComponent {
    type: ComponentType.array;
    items$: Observable<Items>;
}

export function createArrayComponent(): IArrayComponent {
    const update$ = new Subject<IElement<any>[]>();
    const [destroy, destroy$] = destroyer();

    const items$ = new Observable<Items>(observer => {
        const dynamicEntries = new Map<ElementKeyType, ReturnType<typeof ReplayDynamicEntry>>();

        destroy$.subscribe(() => {
            for (let value of dynamicEntries.values()) {
                value.destroy();
            }
        });

        update$.pipe(
            log('ARR COMP UPD'),
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
                    prev.every((p, i) => Object.is(p.props.key, curr[i].props.key))
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
                            if (Object.is(prevKey, curr[currKey].props.key)) {
                                shouldRemove = false;
                                break;
                            }
                        }

                        if (shouldRemove) {
                            const dynamicEntry = dynamicEntries.get(prevKey);
                            dynamicEntry.destroy();
                            dynamicEntries.delete(prevKey);
                        }
                    }
                }

                const observableItems = curr.map((definition) => {
                    const key = definition.props.key;

                    if (
                        key == null
                        || typeof key == 'object'
                        || typeof key == 'function'
                    ) {
                        const err = new Error('Key should be string | number | bigint | boolean | Symbol');
                        // TODO: error only in dev mode
                        console.error(err);
                        throw err;
                    }

                    let dynamicEntry = dynamicEntries.get(key);

                    if (dynamicEntry == undefined) {
                        dynamicEntry = ReplayDynamicEntry();
                        dynamicEntries.set(key, dynamicEntry);
                    }

                    return new Observable<Item>(observer => {
                        dynamicEntry.result$.pipe(
                            distinctUntilChanged(),
                            map((component) => ({ key, component })),
                        ).subscribe(observer);

                        dynamicEntry.connect();

                        console.log('ARR UPD PUSH', definition);

                        dynamicEntry.update$.next(definition);
                    });
                });

                // TODO: keep existing keys subscription
                return combineLatest(...observableItems);
            }),
            // tap((items) => {
            //     console.log('<ARR COMPILE>');
            //     items.forEach(({ key, component }) => console.log('-', key, component['definition']))
            //     console.log('</ ARR COMPILE>');
            // }),
            takeUntil(destroy$),
        ).subscribe(observer);
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
