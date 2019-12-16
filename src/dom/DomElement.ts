import { IElement } from "../engine/Element";
import { isSubject } from '../helpers/isSubject';

const PRESERVED_KEYS = ['children', 'key', 'ref'];

const EVENT_REGEXP = /^on[A-Z]/;
const EVENT_PREFIX_LENGTH = 2;
const isEventAttr = (attrName: string) => EVENT_REGEXP.test(attrName);
const getEventFromAttr = (attrName: string) => attrName.substring(EVENT_PREFIX_LENGTH).toLowerCase();

export const createDomElement = (definition: IElement<string>) => {
    const htmlElement = document.createElement(definition.type);

    Object.entries(definition.props).forEach(([key, value]) => {
        if (PRESERVED_KEYS.includes(key)) {
            return;
        }

        if (isEventAttr(key)) {
            const eventName = getEventFromAttr(key);
            if (typeof value == 'function') {
                htmlElement.addEventListener(eventName, value);
            }
        } else {
            if (value != null) {
                htmlElement.setAttribute(key, value);
            }
        }
    });

    return htmlElement;
}

// updates DOMNode props, compared to prevProps
export const updateAttribute = (htmlElement, key, prevValue, currValue) => {
    if (isEventAttr(key)) {
        const eventName = getEventFromAttr(key);

        if (typeof prevValue == 'function') {
            htmlElement.removeEventListener(eventName, prevValue as EventListener);
        } else if(isSubject(prevValue)){
            htmlElement.removeEventListener(eventName, prevValue.next);
        }

        if (typeof currValue == 'function') {
            htmlElement.addEventListener(eventName, currValue as EventListener);
        } else if(isSubject(currValue)){
            htmlElement.addEventListener(eventName, currValue.next);
        }

    } else {
        if (currValue == void 0) {
            htmlElement.removeAttribute(key);
        } else {
            htmlElement.setAttribute(key, currValue);
        }
    }
}


export const updateDomElement = (prevProps, currProps, htmlElement: HTMLElement) => {
    // update prev props
    Object.entries(prevProps).forEach(([key, prevValue]) => {
        if (PRESERVED_KEYS.includes(key)) {
            return;
        }

        if (key in currProps) {
            const currValue = currProps[key];
            if (currValue != prevValue) {
                if (isEventAttr(key)) {
                    const eventName = getEventFromAttr(key);
                    if (typeof prevValue == 'function') {
                        htmlElement.removeEventListener(eventName, prevValue as EventListener);
                    }

                    if (typeof currValue == 'function') {
                        htmlElement.addEventListener(eventName, currValue as EventListener);
                    }

                } else {
                    htmlElement.setAttribute(key, currValue);
                }
            }
        } else {
            htmlElement.removeAttribute(key);
        }
    });

    // add new props
    Object.entries(currProps).forEach(([key, currValue]) => {
        if (PRESERVED_KEYS.includes(key)) {
            return;
        }

        if (key in prevProps) {
            return;
        }

        if (isEventAttr(key)) {
            const eventName = getEventFromAttr(key);
            if (typeof currValue == 'function') {
                htmlElement.addEventListener(eventName, currValue as EventListener);
            }

        } else {
            htmlElement.setAttribute(key, currValue as any);
        }
    });
}