import { isObservable, Observable, of, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';

/**
 * Operator to split a stream of Objects into it's individual property streams
 *
 * Source:
 * ---{ a:1, b:42 }-----{ a: 2, c: 1 }----{ b: 1337 }-------|
 *
 *
 * ---key:a,key:b-------key:c-------------key:b-------------|
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
    return (source$) =>
        new Observable<Observable<unknown>>((observer) => {
            const propSubjectRegistry = new Map<
                string,
                Subject<Observable<unknown>>
            >();
            const subscription = source$.subscribe({
                next: (change) => {
                    const changeEntries = Object.entries(change);
                    for (let [key, value] of changeEntries) {
                        let stream: Subject<Observable<unknown>>;

                        if (!propSubjectRegistry.has(key)) {
                            stream = new Subject<Observable<unknown>>();
                            propSubjectRegistry.set(key, stream);
                            const propStream = stream.pipe(switchMap((o) => o));
                            propStream['key'] = key;
                            observer.next(propStream);
                        }

                        if (!stream) {
                            stream = propSubjectRegistry.get(key);
                        }

                        stream.next(isObservable(value) ? value : of(value));
                    }

                    for (let oldKey of propSubjectRegistry.keys()) {
                        if (oldKey in change) {
                            continue;
                        }

                        const deprecatedStream = propSubjectRegistry.get(
                            oldKey,
                        );
                        deprecatedStream.complete();
                        propSubjectRegistry.delete(oldKey);
                    }
                },
                error: (e) => observer.error(e),
                complete: () => observer.complete(),
            });

            // complete all streams on unsubscription
            subscription.add(() => {
                [...propSubjectRegistry.values()].forEach((v) => v.complete());
            });

            return subscription;
        });
}
