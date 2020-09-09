import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged, map, switchMap, takeUntil } from 'rxjs/operators';
import { asObservable } from '../../helpers/asObservable';
import { destroyer } from '../../helpers/destroyer';
import { IElement } from '../Element';
import { DynamicEntry } from './dynamic-entry/DynamicEntry';
import { ComponentType } from './helpers';
import { IBasicComponent, IComponent } from './index';

export interface IFnComponent extends IBasicComponent {
    type: ComponentType.fn;
    result$: Observable<IComponent>;
}

export function createFnComponent(definition: IElement<Function>): IFnComponent {
    const update$ = new Subject<IElement<Function>>();
    const [destroy, destroy$] = destroyer();

    const props$ = update$.pipe(
        map((update) => update.props),
        takeUntil(destroy$),
    );

    const result$ = new Observable<IComponent>(observer => {
        // TODO: rethink
        // TODO: if prop has Observable -- use combineLatest to merge it in
        // TODO: make it replayable for late subscription
        const proxiedProps = new Proxy(
            props$,
            {
                get(target, prop, receiver) {
                    if (Reflect.has(target, prop)) {
                        return Reflect.get(target, prop, receiver);
                    }

                    // TODO: make proxy consistent so each get returns the same value,
                    //       so `a.stream === a.stream`
                    return target.pipe(
                        map(o => o && Reflect.get(o, prop)),
                        distinctUntilChanged(),
                        switchMap(asObservable),
                        takeUntil(destroy$)
                    )
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


