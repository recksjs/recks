/**
 * Triggers click event on an element
 *
 * @param element Element to click on
 */
export function clickOn(element: Element) {
    const event = document.createEvent('HTMLEvents');
    event.initEvent('click', false, true);
    return element.dispatchEvent(event);
}

/**
 * Recreates root div for each test run
 */
export function createTestRoot() {
    const container: { el: HTMLElement } = {
        el: null,
    };

    beforeEach(() => {
        container.el = document.createElement('div');
        document.body.appendChild(container.el);
    });

    afterEach(() => {
        document.body.removeChild(container.el);
    });

    return container;
}
