import { isObservable, Observable, Subject } from 'rxjs';
import { isThenable } from '../../helpers/isThenable';
import { isFunction } from '../../helpers/isFunction';
import { isArray } from '../../helpers/isArray';
import { IElement, isElement } from '../Element';
import { ILeafComponent } from './Leaf';
import { IStaticComponent } from './Static';
import { IObservableComponent } from './Observable';
import { IFnComponent } from './Fn';
import { IArrayComponent } from './Array';

export type IChild = null | number | string | IElement<any> | Array<IElement<any>> | Observable<any>;

export interface IBasicComponent {
    update$: Subject<IChild>;
    destroy$: Subject<void>;
}

export type IComponent = ILeafComponent | IStaticComponent | IObservableComponent | IFnComponent | IArrayComponent;

export enum ComponentType {
    leaf = 'leaf',
    fn = 'fn',
    array = 'array',
    observable = 'observable',
    static = 'static'
}

export function getType(child: IChild): ComponentType {
    if (isObservable(child) || isThenable(child)) {
        return ComponentType.observable;
    } else if (isArray(child)) {
        return ComponentType.array;
    } else if (isElement(child)) {
        if (typeof child.type == 'string') {
            return ComponentType.static;
        } else if (isFunction(child.type)) {
            return ComponentType.fn;
        }
    }

    return ComponentType.leaf;
}