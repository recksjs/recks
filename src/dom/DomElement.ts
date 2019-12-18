import { IElement } from "../engine/Element";
import { isSubject } from '../helpers/isSubject';
import { Subject } from 'rxjs';
import { isFunction } from '../helpers/isFunction';

const PRESERVED_KEYS = ['children', 'key', 'ref'];

const EVENT_REGEXP = /^on[A-Z]/;
const EVENT_PREFIX_LENGTH = 2;
const isEventAttr = (attrName: string) => EVENT_REGEXP.test(attrName);
const getEventFromAttr = (attrName: string) => attrName.substring(EVENT_PREFIX_LENGTH).toLowerCase();

export function createDomElement(definition: IElement<string>) {
    const htmlElement = document.createElement(definition.type);

    Object.entries(definition.props).forEach(([key, value]) => {
        if (PRESERVED_KEYS.includes(key)) {
            return;
        }

        if (isEventAttr(key)) {
            const eventName = getEventFromAttr(key);
            addEventListener(htmlElement, eventName, value);
        } else {
            setAttribute(htmlElement, key, value);
        }
    });

    return htmlElement;
}

export function updateDomElement(prevProps, currProps, htmlElement: HTMLElement) {
    if (prevProps === currProps) {
        throw 'A new props object should be passed during a re-render';
    }

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
                    removeEventListener(htmlElement, eventName, prevValue as any);
                    addEventListener(htmlElement, eventName, prevValue as any);
                } else {
                    setAttribute(htmlElement, key, currValue);
                }
            }
        } else {
            removeAttribute(htmlElement, key);
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
            addEventListener(htmlElement, eventName, currValue as any);
        } else {
            setAttribute(htmlElement, key, currValue);
        }
    });
}

// updates DOMNode props, compared to prevProps
function removeEventListener(htmlElement: HTMLElement, eventName: string, handler: void | Function | Subject<any>) {
    if (!handler) {
        return;
    }

    if (isFunction(handler)) {
        htmlElement.removeEventListener(eventName, handler as EventListener);
    } else if (isSubject(handler)) {
        htmlElement.removeEventListener(eventName, handler.next);
    }
}

function addEventListener(htmlElement: HTMLElement, eventName: string, handler: void | Function | Subject<any>) {
    if (!handler) {
        return;
    }

    if (isFunction(handler)) {
        htmlElement.addEventListener(eventName, handler as EventListener);
    } else if (isSubject(handler)) {
        htmlElement.addEventListener(eventName, handler.next);
    }
}

function setAttribute(htmlElement: HTMLElement, key, value) {
    htmlElement.setAttribute(key, value);
}

function removeAttribute(htmlElement: HTMLElement, key) {
    htmlElement.removeAttribute(key);
}

