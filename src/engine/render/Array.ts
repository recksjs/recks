import { combineLatest, Observable, of, ReplaySubject } from 'rxjs';
import { map, pairwise, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { ICompiledComponent, renderComponent } from '.';
import { createDestroyer } from '../../helpers/destroyer';
import { IComponent } from '../component';
import { IArrayComponent } from '../component/Array';
import { ElementKeyType } from '../Element';
import { IHTMLRenderElement } from './Static';

export interface IArrayChildRenderElement {
    key: ElementKeyType;
    renderElement: IHTMLRenderElement;
}

export type IArrayChildrenRenderElements = IArrayChildRenderElement[];

export function renderArray(component: IArrayComponent, xmlns: string) {
    // NOTE: this code block is similar to Array Component logic
    // TODO: refactor

    const HTMLElementStreams = new Map<
        ElementKeyType,
        {
            component: IComponent;
            result$: Observable<IArrayChildRenderElement>;
            destroy: () => void;
        }
    >();

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
                    const prevItem = prev[prevIndex];
                    const prevKey = prevItem.key;
                    const prevComp = prevItem.component;

                    for (
                        let currIndex = 0;
                        currIndex < curr.length;
                        currIndex++
                    ) {
                        const currItem = curr[currIndex];
                        if (
                            Object.is(prevKey, currItem.key) &&
                            prevComp === currItem.component
                        ) {
                            shouldRemove = false;
                            break;
                        }
                    }

                    if (shouldRemove) {
                        const domStream = HTMLElementStreams.get(prevKey);
                        domStream.destroy();
                        HTMLElementStreams.delete(prevKey);
                    }
                }
            }

            const itemStreams = curr.map((entry) => {
                const { key, component } = entry;

                const elementStream = HTMLElementStreams.get(key);
                if (elementStream != null) {
                    return elementStream.result$;
                }

                const [destroy, destroy$] = createDestroyer();
                const _result$ = new ReplaySubject<IArrayChildRenderElement>(1);
                const result$ = _result$.pipe(takeUntil(destroy$));

                renderComponent(component, xmlns)
                    .pipe(
                        map<ICompiledComponent, IArrayChildRenderElement>(
                            // NOTE: casting ICompiledComponent to IRenderElement here
                            //       currently array child cannot be another array
                            (renderElement: IHTMLRenderElement) => ({
                                key,
                                renderElement,
                            }),
                        ),
                        takeUntil(destroy$),
                    )
                    .subscribe(_result$);

                HTMLElementStreams.set(key, { component, result$, destroy });

                return result$;
            });

            return combineLatest(...itemStreams);
        }),
    );
}
