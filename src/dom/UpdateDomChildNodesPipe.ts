import { pipe } from 'rxjs';
import { pairwise, startWith, tap } from 'rxjs/operators';
import { ICompiledComponent } from '../engine/render';
import { IArrayChildRenderElement } from '../engine/render/Array';
import {
    IHTMLRenderElement,
    isHTMLRenderElement,
} from '../engine/render/Static';
import { isArray } from '../helpers/isArray';

export function updateDomChildNodesPipe(target: Element) {
    const initialState = [];

    return pipe(
        startWith(initialState),
        pairwise(),
        tap(
            ([prevChildren, currChildren]: [
                ICompiledComponent[],
                ICompiledComponent[],
            ]) => {
                const elementsThatMount: IHTMLRenderElement[] = [];

                // intial render
                // creates a fragment and appends the fragment to parent
                if (!prevChildren || !prevChildren.length) {
                    const fragment = window.document.createDocumentFragment();
                    for (let currChild of currChildren) {
                        if (currChild) {
                            if (isArray(currChild)) {
                                currChild.forEach((entry) => {
                                    if (entry) {
                                        fragment.appendChild(
                                            entry.renderElement.htmlElement,
                                        );

                                        if (entry.renderElement.element$) {
                                            elementsThatMount.push(
                                                entry.renderElement,
                                            );
                                        }
                                    }
                                });
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
                    let insertBeforeNode: Element | Text = null;
                    for (let i = currChildren.length - 1; i >= 0; i--) {
                        const prevChild = prevChildren[i];
                        const currChild = currChildren[i];

                        if (prevChild == currChild) {
                            if (!isArray(currChild)) {
                                insertBeforeNode = currChild.htmlElement;
                            } else if (
                                currChild.length &&
                                currChild[0].renderElement.htmlElement
                            ) {
                                insertBeforeNode =
                                    currChild[0].renderElement.htmlElement;
                            }

                            continue;
                        }

                        if (!isArray(prevChild) && !isArray(currChild)) {
                            if (prevChild.htmlElement) {
                                if (currChild.htmlElement) {
                                    target.replaceChild(
                                        currChild.htmlElement,
                                        prevChild.htmlElement,
                                    );

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
                                target.insertBefore(
                                    currChild.htmlElement,
                                    insertBeforeNode,
                                );
                                insertBeforeNode = currChild.htmlElement;
                                continue;
                            }

                            continue;
                        }

                        // array updates (-_-)
                        // prevChild is array
                        // remove all prev array elements, and add current child
                        if (isArray(prevChild) && !isArray(currChild)) {
                            prevChild.forEach((entry) => {
                                target.removeChild(
                                    entry.renderElement.htmlElement,
                                );
                            });

                            target.insertBefore(
                                currChild.htmlElement,
                                insertBeforeNode,
                            );
                            insertBeforeNode = currChild.htmlElement;

                            continue;
                        }

                        // currChild is array
                        // remove prev element, and add array elements
                        if (!isArray(prevChild) && isArray(currChild)) {
                            target.removeChild(prevChild.htmlElement);

                            if (!currChild.length) {
                                continue;
                            }

                            const documentFragment = window.document.createDocumentFragment();
                            for (let j = 0; j < currChild.length; j++) {
                                documentFragment.appendChild(
                                    currChild[j].renderElement.htmlElement,
                                );
                                if (
                                    isHTMLRenderElement(
                                        currChild[j].renderElement,
                                    )
                                ) {
                                    elementsThatMount.push(
                                        currChild[j].renderElement,
                                    );
                                }
                            }

                            target.insertBefore(
                                documentFragment,
                                insertBeforeNode,
                            );
                            insertBeforeNode =
                                currChild[0].renderElement.htmlElement;
                            continue;
                        }

                        // array to array update
                        // console.warn('suboptimal array update');
                        if (isArray(prevChild) && isArray(currChild)) {
                            // store current array keys
                            const currKeys = new Array(currChild.length).fill(
                                void 0,
                            );
                            // Try early exit if all elements are equal
                            if (prevChild.length == currChild.length) {
                                let arraysAreEqual = true;
                                for (
                                    let j = currChild.length - 1;
                                    j >= 0;
                                    j--
                                ) {
                                    if (
                                        arraysAreEqual &&
                                        (currChild[j].key !==
                                            prevChild[j].key ||
                                            currChild[j].renderElement
                                                .htmlElement !==
                                                prevChild[j].renderElement
                                                    .htmlElement)
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
                                for (
                                    let j = currChild.length - 1;
                                    j >= 0;
                                    j--
                                ) {
                                    currKeys[j] = currChild[j].key;
                                }
                            }

                            const entriesThatStay: IArrayChildRenderElement[] = [];
                            for (let j = prevChild.length - 1; j >= 0; j--) {
                                if (!currKeys.includes(prevChild[j].key)) {
                                    target.removeChild(
                                        prevChild[j].renderElement.htmlElement,
                                    );
                                } else {
                                    entriesThatStay.unshift(prevChild[j]);
                                }
                            }

                            let k = entriesThatStay.length - 1;
                            for (let j = currChild.length - 1; j >= 0; j--) {
                                if (
                                    k >= 0 &&
                                    currChild[j].key == entriesThatStay[k].key
                                ) {
                                    if (
                                        currChild[j].renderElement
                                            .htmlElement !==
                                        entriesThatStay[k].renderElement
                                            .htmlElement
                                    ) {
                                        target.replaceChild(
                                            currChild[j].renderElement
                                                .htmlElement,
                                            entriesThatStay[k].renderElement
                                                .htmlElement,
                                        );

                                        if (
                                            isHTMLRenderElement(
                                                currChild[j].renderElement,
                                            )
                                        ) {
                                            elementsThatMount.push(
                                                currChild[j].renderElement,
                                            );
                                        }
                                    }

                                    insertBeforeNode =
                                        currChild[j].renderElement.htmlElement;
                                    k--;
                                    continue;
                                }

                                try {
                                    target.insertBefore(
                                        currChild[j].renderElement.htmlElement,
                                        insertBeforeNode,
                                    );
                                    if (
                                        isHTMLRenderElement(
                                            currChild[j].renderElement,
                                        )
                                    ) {
                                        elementsThatMount.push(
                                            currChild[j].renderElement,
                                        );
                                    }
                                } catch (e) {
                                    // TODO: atm there are cases when prev node
                                    //       is absent on the DOM
                                    //       possible reasons:
                                    //       - it was replaced or wasnt added at all
                                    //       - a key occures two or more times in the array
                                    console.error(e);
                                }

                                insertBeforeNode =
                                    currChild[j].renderElement.htmlElement;
                            }

                            for (; k >= 0; k--) {
                                target.removeChild(
                                    entriesThatStay[k].renderElement
                                        .htmlElement,
                                );
                                if (
                                    isHTMLRenderElement(
                                        entriesThatStay[k].renderElement,
                                    )
                                ) {
                                    elementsThatMount.push(
                                        entriesThatStay[k].renderElement,
                                    );
                                }
                            }

                            continue;
                        }
                    }
                }

                elementsThatMount.forEach((el) =>
                    el.element$.next(el.htmlElement),
                );
            },
        ),
    );
}
