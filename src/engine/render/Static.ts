import { combineLatest, EMPTY, GroupedObservable, Observable, of, Subject } from 'rxjs';
import { distinctUntilChanged, flatMap, map, pairwise, share, startWith, switchMap, tap } from 'rxjs/operators';
import { PRESERVED_KEYS } from '../../constants';
import { createDomElement, getEventFromAttr, isEventAttr, removeAttribute, removeEventListener, updateAttribute, updateEventListener } from '../../dom/DomElement';
import { UpdateDomChildNodesPipe } from '../../dom/UpdateDomChildNodesPipe';
import { isSubject } from '../../helpers/isSubject';
import { IStaticComponent } from '../component/Static';
import { ICompiledComponent, renderComponent } from './index';

export interface IHTMLRenderElement {
    type: 'HTMLElement'
    element$: Subject<HTMLElement>;
    htmlElement: HTMLElement;
}

export const isHTMLRenderElement = (element: ICompiledComponent): element is IHTMLRenderElement => {
    return element && 'type' in element && element.type == 'HTMLElement';
}

// watch updates
//    update domElement
// subscribe to child updates
//    for each child udpate -- render component( target = domElement )
export function renderStatic(component: IStaticComponent) : Observable<IHTMLRenderElement> {
    const htmlElement = createDomElement(component.definition);

    // UPDATE DOM ELEMENT
    component.change$.pipe(
        // split change$ stream into individual prop streams
        source$ => new Observable(observer => {
            const map = new Map<string, Subject<unknown>>();
            const subscription = source$.subscribe({
                next: change => {
                    const changeEntries = Object.entries(change);
                    for (let [key, value] of changeEntries) {
                        let stream: Subject<unknown>;

                        if (!map.has(key)) {
                            stream = new Subject();
                            stream['key'] = key;
                            map.set(key, stream)
                            observer.next(stream);
                        }

                        if (!stream) {
                            stream = map.get(key);
                        }

                        stream.next(value);
                    }

                    for (let oldKey of map.keys()) {
                        if (oldKey in change) {
                            continue;
                        }

                        const deprecatedStream = map.get(oldKey);
                        deprecatedStream.complete();
                        map.delete(oldKey)
                    }
                },
                error: observer.error,
                complete: observer.complete
            })

            // complete all streams on unsubscription
            subscription.add(()=>{
                [...map.values()].forEach(v => v.complete());
            })

            return subscription;
        }),

        // subscribe to each stream and update DOM accordingly
        flatMap((group: GroupedObservable<string, unknown>) => {
            const key = group.key;
            if (PRESERVED_KEYS.includes(group.key)) {
                return EMPTY;
            }

            const distinct$ = group.pipe(
                distinctUntilChanged(),
                startWith(void 0),
                share(),
            )

            const isEvent = isEventAttr(group.key)

            if (!isEvent) {
                return distinct$.pipe(
                    tap({
                        next: value => updateAttribute(htmlElement, key, value),
                        complete: () => removeAttribute(htmlElement, key)
                    })
                )
            } else {
                const eventName = isEvent && getEventFromAttr(key);
                let latestValue: Function | void;

                return distinct$.pipe(
                    map(value => isSubject(value) ? x => value.next(x) : value),
                    pairwise(),
                    tap({
                        next: ([a, b]) => {
                            latestValue = b as Function | void;
                            updateEventListener(htmlElement, eventName, a, b)
                        },
                        complete: () => {
                            removeEventListener(htmlElement, eventName, latestValue)
                        }
                    })
                )
            }
        })
    ).subscribe()

    // NOTE: perf optimisation:
    // to make first render faster, we wait for all children to emit their
    // first value (vDOM) and only then we append all emissions to the parent
    combineLatest(
        ...component.dynamicChildren
            .map(dynamicChild =>
                dynamicChild.result$.pipe(
                    switchMap(result => renderComponent(result))
                )
            )
    ).pipe(
        UpdateDomChildNodesPipe(htmlElement),
    )
        .subscribe();

    return of({
        type: 'HTMLElement',
        element$: component.element$,
        htmlElement
    });
}