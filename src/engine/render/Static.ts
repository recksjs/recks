import { combineLatest, Observable, of, Subject } from 'rxjs';
import { pairwise, switchMap } from 'rxjs/operators';
import { ICompiledComponent, renderComponent } from '.';
import { createDomElement, updateDomElement } from '../../dom/DomElement';
import { UpdateDomChildNodesPipe } from '../../dom/UpdateDomChildNodesPipe';
import { IStaticComponent } from '../component/Static';

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
        pairwise(),
    ).subscribe(([a, b]) => updateDomElement(a, b, htmlElement))

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