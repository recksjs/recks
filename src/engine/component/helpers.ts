import { isObservable, Observer } from 'rxjs';
import { isArray } from '../../helpers/isArray';
import { isFunction } from '../../helpers/isFunction';
import { isThenable } from '../../helpers/isThenable';
import { isElement } from '../Element';
import { IChild } from '../IChild';
import { IArrayComponent } from './Array';
import { IFnComponent } from './Fn';
import { ILeafComponent } from './Leaf';
import { IObservableComponent } from './Observable';
import { IStaticComponent } from './Static';

export interface IBasicComponent {
    update$: Observer<IChild>;
    destroy: () => void;
}

export type IComponent =
    | ILeafComponent
    | IStaticComponent
    | IObservableComponent
    | IFnComponent
    | IArrayComponent;

export enum ComponentType {
    leaf = 'leaf',
    fn = 'fn',
    array = 'array',
    observable = 'observable',
    static = 'static',
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
