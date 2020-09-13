import { Observable, ReplaySubject } from 'rxjs';
import { distinctUntilChanged, map, pluck, switchMap, takeUntil } from 'rxjs/operators';
import { asObservable } from '../../helpers/asObservable';
import { createDestroyer } from '../../helpers/destroyer';
import { IElement } from '../Element';
import { DynamicEntry } from './dynamic-entry/DynamicEntry';
import { ComponentType } from './helpers';
import { IBasicComponent, IComponent } from './index';

export interface IFnComponent extends IBasicComponent {
    type: ComponentType.fn;
    result$: Observable<IComponent>;
}

export function createFnComponent(definition: IElement<Function>): IFnComponent {
    const update$ = new ReplaySubject<IElement<Function>>(1);
    const [destroy, destroy$] = createDestroyer();

    const props$ = update$.pipe(
        pluck('props'),
        takeUntil(destroy$),
    );

    const result$ = new Observable<IComponent>(observer => {
        // WARN: Prop threads are an experimental feature
        const propThreadMap = new Map<string, Observable<unknown>>();
        const proxiedProps = new Proxy(
            props$,
            {
                get(target, prop, receiver) {
                    // props$ Observable API
                    if (Reflect.has(target, prop)) {
                        return Reflect.get(target, prop, receiver);
                    }

                    // Prop thread
                    let observable = propThreadMap.get(prop as any);
                    if (observable !== undefined) {
                        return observable;
                    }

                    observable = target.pipe(
                        map(o => o && Reflect.get(o, prop)),
                        distinctUntilChanged(),
                        switchMap(asObservable),
                        takeUntil(destroy$)
                    );

                    propThreadMap.set(prop as any, observable);
                    return observable;
                }
            }
        );

        const dynamicRoot = DynamicEntry();

        dynamicRoot.result$.subscribe(observer);

        destroy$.subscribe(dynamicRoot.destroy);

        // run the component fn
        const result = definition.type(proxiedProps, { destroy$ });

        // TODO: check if the value can be rendered
        // (is an Element or a basic type)
        // and throw otherwise
        asObservable(result)
            .pipe(takeUntil(destroy$))
            .subscribe(dynamicRoot.update$);
    })

    return {
        type: ComponentType.fn,
        // lifecycle
        update$,
        destroy,
        // out
        result$,
    };
}


