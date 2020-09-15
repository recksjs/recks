import { Subject } from 'rxjs';
import { Recks } from '../../src/index';
import { createTestRoot } from './helpers';

describe('SVG support', () => {
    const root = createTestRoot();
    let App$: Subject<any>;
    const App = () => App$;

    beforeEach(() => {
        if (App$) {
            App$.complete();
        }

        App$ = new Subject();
    });

    test('Should render svg using xmlns', () => {
        Recks.render(<App />, root.el);
        App$.next(
            <svg xmlns="http://www.w3.org/2000/svg">
                <circle />
            </svg>,
        );
        expect(root.el.children[0].namespaceURI).toBe(
            'http://www.w3.org/2000/svg',
        );
        expect(root.el.children[0].children[0].namespaceURI).toBe(
            'http://www.w3.org/2000/svg',
        );
    });

    test('Should render foreignObject children using default xmlns', () => {
        Recks.render(<App />, root.el);
        App$.next(
            <svg xmlns="http://www.w3.org/2000/svg">
                <foreignObject>
                    <div />
                </foreignObject>
            </svg>,
        );
        expect(root.el.children[0].namespaceURI).toBe(
            'http://www.w3.org/2000/svg',
        );
        expect(root.el.children[0].children[0].namespaceURI).toBe(
            'http://www.w3.org/2000/svg',
        );
        expect(root.el.children[0].children[0].children[0].namespaceURI).toBe(
            'http://www.w3.org/1999/xhtml',
        );
    });
});
