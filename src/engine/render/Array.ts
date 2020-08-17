import { combineLatest, Observable, of, ReplaySubject, Subject } from 'rxjs';
import { map, pairwise, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { IComponent } from '../component';
import { ElementKeyType } from '../Element';
import { IArrayComponent } from '../component/Array';
import { IHTMLRenderElement } from './Static';
import { renderComponent, ICompiledComponent } from '.';

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
            destroy$: Subject<void>;
            result$: Observable<IArrayChildRenderElement>;
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
                    const prevKey = prev[prevIndex].key;

                    for (
                        let currIndex = 0;
                        currIndex < curr.length;
                        currIndex++
                    ) {
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

            curr.forEach((entry) => {
                const { key, component } = entry;
                if (HTMLElementStreams.has(key)) {
                    return;
                }

                const result$ = new ReplaySubject<IArrayChildRenderElement>(1);
                const destroy$ = new Subject<void>();

                renderComponent(component, xmlns)
                    .pipe(
                        map<ICompiledComponent, IArrayChildRenderElement>(
                            // NOTE: casting ICompiledComponent to IRenderElement here
                            //       currently array child cannot be another array
                            (
                                renderElement: /* casting */ IHTMLRenderElement,
                            ) => ({ key, renderElement }),
                        ),
                        takeUntil(destroy$),
                    )
                    .subscribe(result$);

                HTMLElementStreams.set(key, { component, result$, destroy$ });
            });

            return combineLatest(
                ...curr.map(({ key }) => HTMLElementStreams.get(key).result$),
            );
        }),
    );
}
