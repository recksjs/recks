export function clickOn(element: Element) {
    const event = document.createEvent('HTMLEvents');
    event.initEvent('click', false, true);
    return element.dispatchEvent(event);
}
