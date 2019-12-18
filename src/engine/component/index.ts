import { isObservable, Observable, Subject } from 'rxjs';
import { IElement } from '../Element';
import { IStaticComponent, createStaticComponent } from './Static';
import { ILeafComponent, createLeafComponent, LeafComponentValueType } from './Leaf';
import { IObservableComponent, createObservableComponent } from './Observable';
import { IFnComponent, createFnComponent } from './Fn';
import { IArrayComponent, createArrayComponent } from './Array';
import { isThenable } from '../../helpers/isThenable';
import { isFunction } from '../../helpers/isFunction';
import { isArray } from '../../helpers/isArray';


// A component listen to definition updates
// and maps that to self updates and children updates

export type IChild = null | number | string | IElement<any> | Array<IElement<any>> | Observable<any>;

export interface IBasicComponent {
    update$: Subject<IChild>;
    destroy$: Subject<void>;
}

export type IComponent = ILeafComponent | IStaticComponent | IObservableComponent | IFnComponent | IArrayComponent;

export const createComponent = (child: IChild): IComponent => {
    if (child == null || typeof child == 'number' || typeof child == 'string') {
        return createLeafComponent(<LeafComponentValueType>child);
    } else if (isObservable(child)) {
        return createObservableComponent();
    } else if (isThenable(child)) {
        return createObservableComponent();
    } else if (isArray(child)) {
        return createArrayComponent();
    } else if (typeof child.type == 'string') {
        return createStaticComponent(child);
    } else if (isFunction(child.type)) {
        return createFnComponent(child);
    }

    throw 'Unknown type of child';
}
