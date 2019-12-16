import { combineLatest, Observable, of, Subject, isObservable } from 'rxjs';
import { distinctUntilChanged, pairwise, startWith, switchMap, tap, flatMap } from 'rxjs/operators';
import { createDomElement, updateAttribute } from '../../dom/DomElement';
import { isSubject } from '../../helpers/isSubject';
import { UpdateDomChildNodesPipe } from '../../dom/UpdateDomChildNodesPipe';
import { IStaticComponent } from '../component/Static';
import { ICompiledComponent, renderComponent } from '.';

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
export function renderStatic(component: IStaticComponent) {
    const htmlElement = createDomElement(component.definition);

    const splitPropsOperator = () => {
        const propsStreams = new Map<string, Subject<any>>();

        return source$ => {
            return new Observable(observer => {
                return source$.subscribe({
                    next: (props) => {
                        const currentProps = new Map(Object.entries(props));
                        currentProps.delete('children');
                        currentProps.delete('key');
                        for (let propEntry of currentProps) {
                            const [key, value] = propEntry;
                            if (!propsStreams.has(key)) {
                                const value = new Subject();
                                propsStreams.set(key, value);
                                observer.next({ key, value });
                            }
                            propsStreams.get(key).next(value);
                        }

                        for (let propStream of propsStreams) {
                            const [key, value] = propStream;
                            if (!currentProps.has(key)) {
                                value.next(void 0);
                                value.complete();
                                propsStreams.delete(key);
                            }
                        }
                    }
                })
            })
        }
    }

    // UPDATE DOM ELEMENT
    component.change$.pipe(
        splitPropsOperator(),
        flatMap(({ key, value }) => {
            return value.pipe(
                distinctUntilChanged(),
                switchMap(v => {
                    if (isSubject(v)) {
                        return of(v);
                    }

                    if (isObservable(v)) {
                        return v;
                    }

                    return of(v);
                }),
                startWith(void 0),
                pairwise(),
                tap(([prev, curr]) => {
                    updateAttribute(htmlElement, key, prev, curr);
                })
            )
        })
    )
        .subscribe()

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