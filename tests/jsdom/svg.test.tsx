import { Recks } from '../../src/index';
import { Subject } from 'rxjs';

describe('SVG support', () => {
    let rootElement: HTMLElement;
    let App$: Subject<any>;
    const App = () => App$;

    beforeEach(() => {
        rootElement = document.createElement('div');
        document.body.appendChild(rootElement);

        if (App$) {
            App$.complete();
        }

        App$ = new Subject();
    });

    afterEach(() => {
        document.body.removeChild(rootElement);
    });

    test('Should render svg using xmlns', () => {
        Recks.render(<App />, rootElement);
        App$.next(
            <svg xmlns="http://www.w3.org/2000/svg">
                <circle />
            </svg>,
        );
        expect(rootElement.children[0].namespaceURI).toBe(
            'http://www.w3.org/2000/svg',
        );
        expect(rootElement.children[0].children[0].namespaceURI).toBe(
            'http://www.w3.org/2000/svg',
        );
    });

    test('Should render foreignObject children using default xmlns', () => {
        Recks.render(<App />, rootElement);
        App$.next(
            <svg xmlns="http://www.w3.org/2000/svg">
                <foreignObject>
                    <div />
                </foreignObject>
            </svg>,
        );
        expect(rootElement.children[0].namespaceURI).toBe(
            'http://www.w3.org/2000/svg',
        );
        expect(rootElement.children[0].children[0].namespaceURI).toBe(
            'http://www.w3.org/2000/svg',
        );
        expect(
            rootElement.children[0].children[0].children[0].namespaceURI,
        ).toBe('http://www.w3.org/1999/xhtml');
    });
});
