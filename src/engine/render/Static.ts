import { combineLatest, EMPTY, GroupedObservable, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, flatMap, pairwise, share, startWith, switchMap, tap } from 'rxjs/operators';
import { PRESERVED_KEYS } from '../../constants';
import { createDomElement, getEventFromAttr, isEventAttr, removeAttribute, removeEventListener, updateAttribute, updateEventListener } from '../../dom/DomElement';
import { updateDomChildNodesPipe } from '../../dom/UpdateDomChildNodesPipe';
import { splitPropsToStreams } from '../../helpers/splitPropsToStreams';
import { IStaticComponent } from '../component/Static';
import { ICompiledComponent, renderComponent } from './index';

export interface IHTMLRenderElement {
    type: 'Element';
    element$: Subject<Element>;
    htmlElement: Element;
}

export const isHTMLRenderElement = (
    element: ICompiledComponent,
): element is IHTMLRenderElement => {
    return element && 'type' in element && element.type == 'Element';
};


// TODO: ensure all subscriptions are destroyed with returning observable

// watch updates
//    update domElement
// subscribe to child updates
//    for each child udpate -- render component( target = domElement )
export function renderStatic(
    component: IStaticComponent,
    xmlns: string,
): Observable<IHTMLRenderElement> {
    // xmlns is always the same for the same component
    // due to differentiation in DynamicEntry
    xmlns = component.definition.props.xmlns || xmlns;
    if (
        component.definition.type === 'svg' &&
        !component.definition.props.xmlns
    ) {
        xmlns = 'http://www.w3.org/2000/svg';
    }

    const htmlElement = createDomElement(component.definition.type, xmlns);

    const childrenXmlns =
        component.definition.type === 'foreignObject' ? null : xmlns;


    return new Observable<IHTMLRenderElement>(observer => {

        // NOTE: perf optimisation:
        // to make first render faster, we wait for all children to emit their
        // first value (vDOM) and only then we append all emissions to the parent
        combineLatest(
            ...component.dynamicChildren.map((dynamicChild) =>
                dynamicChild.result$.pipe(
                    switchMap((result) => renderComponent(result, childrenXmlns)),
                ),
            ),
        )
            .pipe(updateDomChildNodesPipe(htmlElement))
            .subscribe(); // TODO: kill this subscription w/ outer obs

        // UPDATING DOM ELEMENT
        component.change$.pipe(
            splitPropsToStreams(),

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
                );

                const isEvent = isEventAttr(group.key);

                if (!isEvent) {
                    return distinct$.pipe(
                        tap({
                            next(value) { updateAttribute(htmlElement, key, value) },
                            complete() { removeAttribute(htmlElement, key) },
                        }),
                    );
                } else {
                    const eventName = isEvent && getEventFromAttr(key);
                    let latestValue: Function | void;

                    return distinct$.pipe(
                        pairwise(),
                        tap({
                            next([a, b]) {
                                latestValue = b as Function | void;
                                updateEventListener(
                                    htmlElement,
                                    eventName,
                                    a,
                                    b,
                                );
                            },
                            complete() {
                                removeEventListener(
                                    htmlElement,
                                    eventName,
                                    latestValue,
                                );
                            },
                        }),
                    );
                }
            }),
        )
        .subscribe();

        // TODO: kill this subscription w/ outer obs
        // TODO: handle unsubscription (tap doesn't handle it)

        observer.next({
            type: 'Element',
            element$: component.element$,
            htmlElement,
        });
        observer.complete();
    })
}
