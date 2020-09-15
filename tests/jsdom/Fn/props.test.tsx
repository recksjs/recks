import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Recks } from '../../../src/index';
import { clickOn, createTestRoot } from '../helpers';

describe('Props', () => {
    const root = createTestRoot();

    describe('Static', () => {
        let App$: Subject<any>;
        const App = () => App$;

        beforeEach(() => {
            if (App$) {
                App$.complete();
            }
            App$ = new Subject();
        });

        test('Static props', () => {
            Recks.render(<App />, root.el);
            App$.next(<div title="Yellow">Submarine</div>);
            const divElement = root.el.children[0];
            expect(divElement.innerHTML).toBe('Submarine');
            expect(divElement.getAttribute('title')).toBe('Yellow');
            App$.next(<div alt="alt">Submarine</div>);
            expect(divElement.getAttribute('title')).toBe(null);
            expect(divElement.getAttribute('alt')).toBe('alt');
        });

        test('Output props as function', () => {
            const onClick = jest.fn();
            Recks.render(<App />, root.el);
            App$.next(<button onClick={onClick}>Click me!</button>);

            clickOn(root.el.children[0]);
            expect(onClick.mock.calls.length).toBe(1);

            clickOn(root.el.children[0]);
            expect(onClick.mock.calls.length).toBe(2);

            App$.next(<button>Don't click me!</button>);
            clickOn(root.el.children[0]);
            expect(onClick.mock.calls.length).toBe(2);
        });

        test('Output props as function: subsequent update', () => {
            const onClick = jest.fn();
            Recks.render(<App />, root.el);
            App$.next(<button>Click me!</button>);

            clickOn(root.el.children[0]);
            expect(onClick.mock.calls.length).toBe(0);

            App$.next(<button onClick={onClick}>Click me!</button>);

            clickOn(root.el.children[0]);
            expect(onClick.mock.calls.length).toBe(1);
        });

        describe('Output props as Observable', () => {
            test('Basic case', () => {
                const one = jest.fn();
                const two = jest.fn();
                const onClick$ = new Subject();

                Recks.render(<App />, root.el);
                App$.next(<button onClick={onClick$}>Click me!</button>);

                clickOn(root.el.children[0]);

                expect(one.mock.calls.length).toBe(0);
                expect(two.mock.calls.length).toBe(0);

                onClick$.next(one);
                clickOn(root.el.children[0]);

                expect(one.mock.calls.length).toBe(1);
                expect(two.mock.calls.length).toBe(0);

                onClick$.next(two);
                clickOn(root.el.children[0]);
                expect(one.mock.calls.length).toBe(1);
                expect(two.mock.calls.length).toBe(1);
            });
        });
    });

    describe('Subcomponents', () => {
        test('Static props', () => {
            const Child = (props$) =>
                props$.pipe(
                    map((props: any) => (
                        <div>
                            {props.title}:{typeof props.title}
                        </div>
                    )),
                );
            const App = () => <Child title="Morning" />;

            Recks.render(<App />, root.el);
            expect(root.el.children[0].innerHTML).toBe('Morning:string');
        });
    });
});
