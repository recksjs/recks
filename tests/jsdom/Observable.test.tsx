import { of, range } from 'rxjs';
import { map } from 'rxjs/operators';
import { Recks } from '../../src/index';
import { createTestRoot } from './helpers';

// TODO: [cover] unhappy paths

describe('Observable', () => {
    const root = createTestRoot();

    describe('Promises', () => {
        test('Text', (done) => {
            // 1 assertion to be run
            expect.assertions(1);

            const promise = Promise.resolve('Text');
            const App = () => promise;
            Recks.render(<App />, root.el);

            // waiting for promise to resolve
            // NOTE: this is a hack, since we're relying on ".thenned" component
            // rendering promise to be handled before this one
            promise.then(() => {
                expect(root.el.innerHTML).toBe('Text');
                done();
            });
        });

        // TODO: cover other node types
    });

    describe('Rx', () => {
        describe('Text', () => {
            test('single', () => {
                const App = () => of(0);

                Recks.render(<App />, root.el);
                expect(root.el.innerHTML).toBe('0');
            });

            test('multiple', () => {
                const App = () => of(0, 42);

                Recks.render(<App />, root.el);
                expect(root.el.innerHTML).toBe('42');
            });
        });

        describe('vDOM', () => {
            test('single', () => {
                const App = () => of(0).pipe(map((x) => <div>{x}</div>));

                Recks.render(<App />, root.el);
                expect(root.el.innerHTML).toBe('<div>0</div>');
            });

            test('updating child', () => {
                const App = () => of(0, 1, 2).pipe(map((x) => <div>{x}</div>));

                Recks.render(<App />, root.el);
                expect(root.el.innerHTML).toBe('<div>2</div>');
            });

            test('updating tag', () => {
                const App = () =>
                    range(1, 6).pipe(
                        map((x) => Recks.createElement('h' + x, void 0, x)),
                    );

                Recks.render(<App />, root.el);
                expect(root.el.innerHTML).toBe('<h6>6</h6>');
            });

            // TODO: cover attributes
        });

        describe('Arrays', () => {
            test('one element', () => {
                const App = () => of([<h1 key="one">hello</h1>]);
                Recks.render(<App />, root.el);
                expect(root.el.innerHTML).toBe('<h1>hello</h1>');
            });

            test('two elements ONLY', () => {
                const App = () =>
                    of([
                        <h1 key="one">hello</h1>,
                        <h1 key="two">world</h1>,
                        <h1 key="tre">!</h1>,
                    ]);
                Recks.render(<App />, root.el);
                expect(root.el.innerHTML).toBe(
                    '<h1>hello</h1><h1>world</h1><h1>!</h1>',
                );
            });

            test('increasing length', () => {
                const App = () =>
                    of(1, 2, 3).pipe(
                        map((i) =>
                            new Array(i)
                                .fill(undefined)
                                .map((_, j) => <div key={j}>{j}</div>),
                        ),
                    );

                Recks.render(<App />, root.el);
                expect(root.el.innerHTML).toBe(
                    '<div>0</div><div>1</div><div>2</div>',
                );
            });

            test('random length', () => {
                const App = () =>
                    of(3, 1, 2).pipe(
                        map((i) =>
                            new Array(i)
                                .fill(undefined)
                                .map((_, j) =>
                                    Recks.createElement('h' + i, { key: j }, j),
                                ),
                        ),
                    );

                Recks.render(<App />, root.el);
                expect(root.el.innerHTML).toBe('<h2>0</h2><h2>1</h2>');
            });
        });
    });
});
