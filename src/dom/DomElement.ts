import { isFunction } from '../helpers/isFunction';

const EVENT_REGEXP = /^on[A-Z]/;
const EVENT_PREFIX_LENGTH = 2;
export const isEventAttr = (attrName: string) => EVENT_REGEXP.test(attrName);
export const getEventFromAttr = (attrName: string) =>
    attrName.substring(EVENT_PREFIX_LENGTH).toLowerCase();

export function createDomElement(type: string, xmlns: string) {
    if (xmlns) {
        return document.createElementNS(xmlns, type);
    } else {
        return document.createElement(type);
    }
}

export function updateAttribute(htmlElement: Element, key: string, value: any) {
    if (value != null) {
        setAttribute(htmlElement, key, value);
    } else {
        removeAttribute(htmlElement, key);
    }
}

function setAttribute(htmlElement: Element, key: string, value: any) {
    htmlElement.setAttribute(key, value);
}

export function removeAttribute(htmlElement: Element, key: string) {
    htmlElement.removeAttribute(key);
}

export function updateEventListener(
    htmlElement: Element,
    eventName,
    prev,
    curr,
) {
    removeEventListener(htmlElement, eventName, prev as any);
    addEventListener(htmlElement, eventName, curr as any);
}

// updates DOMNode props, compared to prevProps
function addEventListener(
    htmlElement: Element,
    eventName: string,
    handler: void | Function,
) {
    if (isFunction(handler)) {
        htmlElement.addEventListener(eventName, handler as EventListener);
    }
}

export function removeEventListener(
    htmlElement: Element,
    eventName: string,
    handler: void | Function,
) {
    if (isFunction(handler)) {
        htmlElement.removeEventListener(eventName, handler as EventListener);
    }
}
