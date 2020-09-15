import { Recks } from '../../../src/index';
import { createTestRoot } from '../helpers';

describe('Fn', () => {
    const root = createTestRoot();

    describe('Root Component', () => {
        test('Text', () => {
            const App = () => 'Text';
            Recks.render(<App />, root.el);
            expect(root.el.innerHTML).toBe('Text');
        });

        test('vDOM', () => {
            const App = () => <div>vDOM</div>;
            Recks.render(<App />, root.el);
            expect(root.el.children[0].innerHTML).toBe('vDOM');
        });

        test('Array', () => {
            const arrayChildren = new Array(3)
                .fill(undefined)
                .map((_, i) => i)
                .map((i) => <span key={i}>{i}</span>);

            const App = () => arrayChildren;

            Recks.render(<App />, root.el);
            expect(root.el.children.length).toBe(3);
            expect(root.el.children[2].innerHTML).toBe('2');
        });
    });
});
