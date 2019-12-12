import { combineLatest, Observable, of, pipe, ReplaySubject, Subject } from 'rxjs';
import { distinctUntilChanged, map, pairwise, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';
import { createComponent, IComponent } from '../engine/Component';
import { ElementKeyType } from '../engine/Element';
import { createDomElement, updateDomElement } from './DomElement';

export const render = (definition, target) => {
    const root = createComponent(definition);

    renderRootComponent(root, target)
        .subscribe();

    root.update$.next(definition);
};

function renderRootComponent(component, target) {
    return compileComponent(component).pipe(
        map(el => [ el ]),
        renderDomChildNodesPipe(target)
    )
}

interface IHTMLRenderElement {
    type: 'HTMLElement'
    element$: Subject<HTMLElement>;
    htmlElement: HTMLElement;
}

const isHTMLRenderElement = (element: ICompiledComponent): element is IHTMLRenderElement => {
    return element && 'type' in element && element.type == 'HTMLElement';
}

interface ITextRenderElement {
    type: 'Text';
    htmlElement: Text;
}

interface IArrayChildRenderElement {
    key: ElementKeyType;
    renderElement: IHTMLRenderElement;
}

type ICompiledComponent = ITextRenderElement | IHTMLRenderElement | IArrayChildRenderElement[];

function compileComponent(component: IComponent) : Observable<ICompiledComponent>{
    if (component.type == 'leaf') {
        // watch updates
        //    update domElement w/ text node
        return component.render$.pipe(
            distinctUntilChanged(),
            map(data => {
                const text = data != null
                    ? data.toString()
                    : ''
                    ;

                return { type: 'Text', htmlElement: document.createTextNode(text) };
            })
        )
    } else if (component.type == 'fn') {
        // watch dyn root comp
        //    on update -- render component( target = target )
        return component.result$.pipe(
            switchMap(result => compileComponent(result))
        )
    } else if (component.type == 'static') {
        // watch updates
        //    update domElement
        // subscribe to child updates
        //    for each child udpate -- render component( target = domElement )
        const htmlElement = createDomElement(component.definition);

        // UPDATE DOM ELEMENT
        component.change$.pipe(
            pairwise(),
        ).subscribe(([a, b]) => updateDomElement(a, b, htmlElement))

        // to make first render faster
        // wait for all children to load first value
        // and only then append em to parent
        combineLatest(
            ...component.dynamicChildren
                .map(dynamicChild =>
                    dynamicChild.result$.pipe(
                        switchMap(result => compileComponent(result))
                    )
                )
        ).pipe(
            renderDomChildNodesPipe(htmlElement),
        )
        .subscribe();

        return of({
            type: 'HTMLElement',
            element$: component.element$,
            htmlElement
        });
    } else if (component.type == 'observable') {
        // watch dyn root comp
        //    on update -- render component( target = target )
        return component.result$.pipe(
            switchMap(result => compileComponent(result))
        )
    } else if (component.type == 'array') {
        // NOTE: this code block is similar to Array Component logic
        // TODO: refactor

        const HTMLElementStreams = new Map<ElementKeyType, { component: IComponent, destroy$: Subject<void>, result$: Observable<IArrayChildRenderElement> }>();

        return component.items$.pipe(
            startWith(null),
            pairwise(),
            switchMap(([prev, curr]) => {
                // shortcut
                // if curr array is empty
                if (curr.length == 0) {
                    HTMLElementStreams.clear();
                    return of([]);
                }

                // removing obsolete keys
                if (prev && prev.length != 0) {
                    for (let prevIndex = 0; prevIndex < prev.length; prevIndex++) {
                        let shouldRemove = true;
                        const prevKey = prev[prevIndex].key;

                        for (let currIndex = 0; currIndex < curr.length; currIndex++) {
                            if (prevKey == curr[currIndex].key) {
                                shouldRemove = false;
                                break;
                            }
                        }

                        if (shouldRemove) {
                            const domStream = HTMLElementStreams.get(prevKey);
                            domStream.component.destroy$.next(void 0);
                            domStream.destroy$.next(void 0);
                            HTMLElementStreams.delete(prevKey);
                        }
                    }
                }

                curr.forEach(entry => {
                    const { key, component } = entry;
                    if (HTMLElementStreams.has(key)) {
                        return;
                    }

                    const result$ = new ReplaySubject<IArrayChildRenderElement>(1);
                    const destroy$ = new Subject<void>();

                    compileComponent(component)
                        .pipe(
                            map<ICompiledComponent, IArrayChildRenderElement>(
                                // NOTE: casting ICompiledComponent to IRenderElement here
                                //       currently array child cannot be another array
                                (renderElement: /* casting */ IHTMLRenderElement) => ({ key, renderElement })
                            ),
                            takeUntil(destroy$)
                        )
                        .subscribe(result$)

                    HTMLElementStreams.set(key, { component, result$, destroy$ });
                });

                return combineLatest(
                    ...curr.map(
                        ({ key }) => HTMLElementStreams.get(key).result$
                    )
                )
            })
        );

    }

    throw 'Unknown component type';
}


function renderDomChildNodesPipe(target: HTMLElement) {
    const initialState = [];

    return pipe(
        startWith(initialState),
        pairwise(),
        tap(([ prevChildren, currChildren ]: [ ICompiledComponent[], ICompiledComponent[] ]) => {
            const elementsThatMount: IHTMLRenderElement[] = [];

            // intial render
            // creates a fragment and appends the fragment to parent
            if (!prevChildren || !prevChildren.length) {
                const fragment = window.document.createDocumentFragment();
                for(let currChild of currChildren) {
                    if (currChild) {
                        if (Array.isArray(currChild)) {
                            currChild.forEach(entry => {
                                if (entry) {
                                    fragment.appendChild(entry.renderElement.htmlElement);

                                    if (entry.renderElement.element$) {
                                        elementsThatMount.push(entry.renderElement);
                                    }
                                }
                            })
                        } else {
                            fragment.appendChild(currChild.htmlElement);
                            if (isHTMLRenderElement(currChild)) {
                                elementsThatMount.push(currChild);
                            }
                        }
                    }
                }

                target.appendChild(fragment);
            } else {

                // smart comparison and DOM update
                let insertBeforeNode: HTMLElement | Text = null;
                for (let i = currChildren.length-1; i >= 0; i--) {
                    const prevChild = prevChildren[i];
                    const currChild = currChildren[i];

                    if (prevChild == currChild) {
                        if (!Array.isArray(currChild)){
                            insertBeforeNode = currChild.htmlElement;
                        } else if (currChild.length && currChild[0].renderElement.htmlElement) {
                            insertBeforeNode = currChild[0].renderElement.htmlElement;
                        }

                        continue;
                    }

                    if (!Array.isArray(prevChild) && !Array.isArray(currChild)) {
                        if (prevChild.htmlElement) {
                            if (currChild.htmlElement) {
                                target.replaceChild(currChild.htmlElement, prevChild.htmlElement);

                                if (isHTMLRenderElement(currChild)) {
                                    elementsThatMount.push(currChild);
                                }

                                insertBeforeNode = currChild.htmlElement;
                            } else {
                                target.removeChild(prevChild.htmlElement);
                            }

                            continue;
                        }

                        if (currChild) {
                            target.insertBefore(currChild.htmlElement, insertBeforeNode);
                            insertBeforeNode = currChild.htmlElement;
                            continue;
                        }

                        continue;
                    }

                    // array updates (-_-)
                    // prevChild is array
                    // remove all prev array elements, and add current child
                    if (Array.isArray(prevChild) && !Array.isArray(currChild)) {
                        prevChild.forEach(entry => {
                            target.removeChild(entry.renderElement.htmlElement);
                        });

                        target.insertBefore(currChild.htmlElement, insertBeforeNode);
                        insertBeforeNode = currChild.htmlElement;

                        continue;
                    }

                    // currChild is array
                    // remove prev element, and add array elements
                    if (!Array.isArray(prevChild) && Array.isArray(currChild)) {
                        target.removeChild(prevChild.htmlElement);

                        if (!currChild.length) {
                            continue;
                        }

                        const documentFragment = window.document.createDocumentFragment();
                        for (let j = 0; j < currChild.length; j++) {
                            documentFragment.appendChild(currChild[j].renderElement.htmlElement);
                            if (isHTMLRenderElement(currChild[j].renderElement)) {
                                elementsThatMount.push(currChild[j].renderElement);
                            }
                        }

                        target.insertBefore(documentFragment, insertBeforeNode);
                        insertBeforeNode = currChild[0].renderElement.htmlElement;
                        continue;
                    }

                    // array to array update
                    // console.warn('suboptimal array update');
                    if (Array.isArray(prevChild) && Array.isArray(currChild)) {
                        // store current array keys
                        const currKeys = (new Array(currChild.length)).fill(void 0);
                        // Try early exit if all elements are equal
                        if (prevChild.length == currChild.length) {
                            let arraysAreEqual = true;
                            for (let j = currChild.length-1; j>=0; j--) {
                                if (arraysAreEqual
                                    && (
                                        currChild[j].key !== prevChild[j].key
                                        || currChild[j].renderElement.htmlElement !== prevChild[j].renderElement.htmlElement
                                    )
                                ) {
                                    arraysAreEqual = false;
                                }

                                // store current array keys
                                currKeys[j] = currChild[j].key;
                            }

                            // early exit here
                            if (arraysAreEqual) {
                                continue;
                            }
                        } else {
                            // store current array keys
                            for (let j = currChild.length-1; j >= 0; j--) {
                                currKeys[j] = currChild[j].key;
                            }
                        }

                        const entriesThatStay: IArrayChildRenderElement[] = [];
                        for (let j = prevChild.length-1; j >= 0; j--) {
                            if (!currKeys.includes(prevChild[j].key)) {
                                target.removeChild(prevChild[j].renderElement.htmlElement);

                            } else {
                                entriesThatStay.unshift(prevChild[j]);
                            }
                        }

                        let k = entriesThatStay.length-1;
                        for (let j = currChild.length-1; j >= 0; j--) {
                            if (k >= 0 && currChild[j].key == entriesThatStay[k].key) {
                                if (currChild[j].renderElement.htmlElement !== entriesThatStay[k].renderElement.htmlElement) {
                                    target.replaceChild(currChild[j].renderElement.htmlElement, entriesThatStay[k].renderElement.htmlElement);

                                    if (isHTMLRenderElement(currChild[j].renderElement)) {
                                        elementsThatMount.push(currChild[j].renderElement);
                                    }

                                }

                                insertBeforeNode = currChild[j].renderElement.htmlElement;
                                k--;
                                continue;
                            }

                            try {
                                target.insertBefore(currChild[j].renderElement.htmlElement, insertBeforeNode);
                                if (isHTMLRenderElement(currChild[j].renderElement)) {
                                    elementsThatMount.push(currChild[j].renderElement);
                                }
                            } catch (e) {
                                // TODO: atm there are cases when prev node
                                //       is absent on the DOM
                                //       possible reasons:
                                //       - it was replaced or wasnt added at all
                                //       - a key occures two or more times in the array
                                console.error(e);
                            }

                            insertBeforeNode = currChild[j].renderElement.htmlElement;
                        }

                        for (;k>=0; k--) {
                            target.removeChild(entriesThatStay[k].renderElement.htmlElement);
                            if (isHTMLRenderElement(entriesThatStay[k].renderElement)) {
                                elementsThatMount.push(entriesThatStay[k].renderElement);
                            }
                        }

                        continue;
                    }
                }
            }

            elementsThatMount.forEach(el => el.element$.next(el.htmlElement));
        })
    )
}
