import { pluck } from 'rxjs/operators';
import { Recks } from '../../../src/index';
import { createTestRoot } from '../helpers';

describe('Fn', () => {
    const root = createTestRoot();

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
        expect(root.el.innerHTML).toBe(
            '<span>0</span><span>1</span><span>2</span>',
        );
    });

    test('Fn', () => {
        const Child = (props$) => <span>{props$.pipe(pluck('title'))}</span>;
        const App = () => <Child title="Hello" />;
        Recks.render(<App />, root.el);
        expect(root.el.innerHTML).toBe('<span>Hello</span>');
    });
});
