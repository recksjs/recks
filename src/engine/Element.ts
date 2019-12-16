import { Observable, Subject } from 'rxjs';
import { IChild } from './component';

const ELEMENT_TYPE = 're-element';

export interface IElement<A extends Function|string> {
    _n: string;
    _type: typeof ELEMENT_TYPE;
    type: A;
    props: IProps;
}

export type ElementKeyType = boolean | number | string | Symbol;

export interface IProps {
    key?: ElementKeyType;
    ref?: Subject<HTMLElement>;
    children?: (Observable<Element> | IElement<any>)[];
    [key: string]: any;
}

const Element = <A extends Function|string>(type: A, props) : IElement<A> => {
    const elementName = (typeof type == 'function') ? type['displayName'] || type.name : type;

    return (
        { _n: elementName
        , _type: ELEMENT_TYPE
        , type
        , props
        }
    )
}

export const isElement = (value: IChild) : value is IElement<any> => {
    return value && (value as any)._type == ELEMENT_TYPE;
}

const EMPTY_CHILDREN = [];
export const createElement = (type, props, ...children): IElement<any> => {
    if (props == null) {
        props = Object.create(null);
    }
    props.children = children || EMPTY_CHILDREN;
    return Element(type, props);
}