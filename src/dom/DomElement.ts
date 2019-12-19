import { IElement } from "../engine/Element";
import { isFunction } from '../helpers/isFunction';

const EVENT_REGEXP = /^on[A-Z]/;
const EVENT_PREFIX_LENGTH = 2;
export const isEventAttr = (attrName: string) => EVENT_REGEXP.test(attrName);
export const getEventFromAttr = (attrName: string) => attrName.substring(EVENT_PREFIX_LENGTH).toLowerCase();

export function createDomElement(definition: IElement<string>) {
    const htmlElement = document.createElement(definition.type);
    return htmlElement;
}

export function updateAttribute(htmlElement: HTMLElement, key, value) {
    if (value != null) {
        setAttribute(htmlElement, key, value);
    } else {
        removeAttribute(htmlElement, key);
    }
}

function setAttribute(htmlElement: HTMLElement, key, value) {
    htmlElement.setAttribute(key, value);
}

export function removeAttribute(htmlElement: HTMLElement, key) {
    htmlElement.removeAttribute(key);
}


export function updateEventListener(htmlElement: HTMLElement, eventName, prev, curr) {
    removeEventListener(htmlElement, eventName, prev as any);
    addEventListener(htmlElement, eventName, curr as any);
}

// updates DOMNode props, compared to prevProps
function addEventListener(htmlElement: HTMLElement, eventName: string, handler: void | Function) {
    if (isFunction(handler)) {
        htmlElement.addEventListener(eventName, handler as EventListener);
    }
}

export function removeEventListener(htmlElement: HTMLElement, eventName: string, handler: void | Function) {
    if (isFunction(handler)) {
        htmlElement.removeEventListener(eventName, handler as EventListener);
    }
}
