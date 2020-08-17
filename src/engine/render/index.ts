import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { updateDomChildNodesPipe } from '../../dom/UpdateDomChildNodesPipe';
import {
    createComponent,
    IComponent,
    IChild,
    ComponentType,
} from '../component';
import { IArrayChildrenRenderElements, renderArray } from './Array';
import { renderFn } from './Fn';
import { ITextRenderElement, renderLeaf } from './Leaf';
import { renderObservable } from './Observable';
import { IHTMLRenderElement, renderStatic } from './Static';

export type ICompiledComponent =
    | ITextRenderElement
    | IHTMLRenderElement
    | IArrayChildrenRenderElements;

export const render = (definition: IChild, target: HTMLElement) => {
    const root = createComponent(definition);

    const subscription = renderRootComponent(root, target).subscribe();

    root.update$.next(definition);

    // TODO: add memory leak test
    //       unsubscription might not spread up the tree
    return subscription;
};

function renderRootComponent(component: IComponent, target: HTMLElement) {
    return renderComponent(component, null).pipe(
        map((el) => [el]),
        updateDomChildNodesPipe(target),
    );
}

export function renderComponent(
    component: IComponent,
    xmlns: string,
): Observable<ICompiledComponent> {
    if (component.type == ComponentType.leaf) {
        return renderLeaf(component);
    } else if (component.type == ComponentType.fn) {
        return renderFn(component, xmlns);
    } else if (component.type == ComponentType.static) {
        return renderStatic(component, xmlns);
    } else if (component.type == ComponentType.observable) {
        return renderObservable(component, xmlns);
    } else if (component.type == ComponentType.array) {
        return renderArray(component, xmlns);
    }

    throw 'Unknown component type';
}
