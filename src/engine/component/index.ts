import { IElement } from '../Element';
import { IChild } from '../IChild';
import { createArrayComponent } from './Array';
import { createFnComponent } from './Fn';
import { ComponentType, getType, IComponent } from './helpers';
import { createLeafComponent, LeafComponentValueType } from './Leaf';
import { createObservableComponent } from './Observable';
import { createStaticComponent } from './Static';

export * from './helpers';

// A component listens to definition updates
// and maps that to self updates and children updates
export const createComponent = (child: IChild): IComponent => {
    const type = getType(child);

    switch (type) {
        case ComponentType.leaf:
            return createLeafComponent(<LeafComponentValueType>child);
        case ComponentType.observable:
            return createObservableComponent();
        case ComponentType.array:
            return createArrayComponent();
        case ComponentType.static:
            return createStaticComponent(child as IElement<string>);
        case ComponentType.fn:
            return createFnComponent(child as IElement<Function>);
        // no default is intentional: getType always returns a type
    }
};
