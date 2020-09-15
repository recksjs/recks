import { Subject } from 'rxjs';
import { Recks } from '../../src/index';
import { createTestRoot } from './helpers';

describe('Array', () => {
    let root = createTestRoot();

    test('Empty', () => {
        Recks.render([], root.el);
        expect(root.el.innerHTML).toBe('');
    });

    test('Single element', () => {
        Recks.render([<div key="1">1</div>], root.el);
        expect(root.el.innerHTML).toBe('<div>1</div>');
    });

    test('Multiple elements', () => {
        Recks.render(
            [1, 2, 3].map((i) => <div key={i}>{i}</div>),
            root.el,
        );
        expect(root.el.innerHTML).toBe('<div>1</div><div>2</div><div>3</div>');
    });

    test('Delayed mounting if one component is async', () => {
        // elements are rendered only when all async siblings resolved
        const stream$ = new Subject<string>();
        const AsyncComp = () => stream$;
        Recks.render(
            [<span key="0">Hello</span>, <AsyncComp key="1" />],
            root.el,
        );
        expect(root.el.innerHTML).toBe('');
        stream$.next(<span>World</span>);
        expect(root.el.innerHTML).toBe('<span>Hello</span><span>World</span>');
    });

    // TODO: cover non-children in array
    // TODO: cover no key provided scenario
    // TODO: cover same key in one array -- currently (v0.0.13) it's not handled issue
});
