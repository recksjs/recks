import { Recks } from '../../src/index';
import { createTestRoot } from './helpers';

describe('Leaf', () => {
    const root = createTestRoot();

    test('String', () => {
        Recks.render('Hi', root.el);
        expect(root.el.innerHTML).toBe('Hi');
    });

    test('Number', () => {
        Recks.render(5, root.el);
        expect(root.el.innerHTML).toBe('5');
    });

    // TODO: cover Symbol, BigInt and Object
});
