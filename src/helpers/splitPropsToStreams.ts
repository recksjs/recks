import { isObservable, Observable, of, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { IProps } from '../engine/Element';
import { createDestroyer } from './destroyer';

/**
 * Operator to split a stream of Objects into it's individual property streams
 *
 *
 * Source:
 * ---{ a:1, b:42 }-----{ a: 2, c: 1 }----{ b: 1337 }-------|
 *
 *
 * Result:
 * ---key:a,key:b-------key:c-------------key:b-------------|
 *
 *
 * Where:
 *
 *    key:a
 *    1-----------------2-----------------------------------|
 *
 *    key:b                               key:b
 *    42----------------|                 42----------------|
 *
 *                      key:c
 *                      1-----------------------------------|
 */
export function splitPropsToStreams() {
    return (source$: Observable<IProps>) =>
        new Observable<Observable<any>>((observer) => {
            const propSubjectRegistry = new Map<
                string,
                {
                    destroy: () => void;
                    source$: Subject<Observable<any>>;
                }
            >();
            const subscription = source$.subscribe({
                next(change) {
                    const changeEntries = Object.entries(change);
                    for (let [key, value] of changeEntries) {
                        let source$: Subject<Observable<any>>;

                        if (!propSubjectRegistry.has(key)) {
                            source$ = new Subject<Observable<any>>();
                            const [destroy, destroy$] = createDestroyer();
                            propSubjectRegistry.set(key, { destroy, source$ });
                            const propStream = source$.pipe(
                                switchMap((o) => o),
                                takeUntil(destroy$),
                            );
                            propStream['key'] = key;
                            observer.next(propStream);
                        }

                        if (!source$) {
                            source$ = propSubjectRegistry.get(key).source$;
                        }

                        source$.next(isObservable(value) ? value : of(value));
                    }

                    for (let oldKey of propSubjectRegistry.keys()) {
                        if (oldKey in change) {
                            continue;
                        }

                        const { destroy, source$ } = propSubjectRegistry.get(
                            oldKey,
                        );
                        source$.complete();
                        destroy();
                        propSubjectRegistry.delete(oldKey);
                    }
                },
                error(e) {
                    observer.error(e);
                },
                complete() {
                    observer.complete();
                },
            });

            // complete all streams on unsubscription
            subscription.add(() => {
                [...propSubjectRegistry.values()].forEach(
                    ({ destroy, source$ }) => {
                        source$.complete();
                        destroy();
                    },
                );
            });

            return subscription;
        });
}
