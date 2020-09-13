import { Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { ICompiledComponent } from '.';
import { ILeafComponent } from '../component/Leaf';

export interface ITextRenderElement {
    type: 'Text';
    htmlElement: Text;
}

// watch updates
//    update domElement w/ text node
export function renderLeaf(
    component: ILeafComponent,
): Observable<ICompiledComponent> {
    return component.render$.pipe(
        distinctUntilChanged(),
        map((data) => {
            const text = data != null ? data.toString() : '';

            return { type: 'Text', htmlElement: document.createTextNode(text) };
        }),
    );
}
