import { Observable, of, range } from 'rxjs';
import { map } from 'rxjs/operators';
import { Recks } from '../../src/index';
// TODO: [chore] properly structurize tests, split into files

// TODO: [cover] attributes
// TODO: [cover] events on vDOM
// TODO: [cover] unhappy paths

describe('Basic', () => {
    let rootElement: HTMLElement;

    beforeEach(() => {
        rootElement = document.createElement('div');
        document.body.appendChild(rootElement);
    });

    afterEach(() => {
        document.body.removeChild(rootElement);
    });

    describe('Static', () => {
        test('Root vDOM', () => {
            Recks.render(<div>Hi</div>, rootElement);
            expect(rootElement.children[0].innerHTML).toBe('Hi');
        });

        describe('Root Component', () => {
            test('Text', () => {
                const App = () => 'Text';
                Recks.render(<App />, rootElement);
                expect(rootElement.innerHTML).toBe('Text');
            });

            test('vDOM', () => {
                const App = () => <div>vDOM</div>;
                Recks.render(<App />, rootElement);
                expect(rootElement.children[0].innerHTML).toBe('vDOM');
            });

            test('Array', () => {
                const arrayChildren = new Array(3)
                    .fill(undefined)
                    .map((_, i) => i)
                    .map((i) => <span key={i}>{i}</span>);

                const App = () => arrayChildren;

                Recks.render(<App />, rootElement);
                expect(rootElement.children.length).toBe(3);
                expect(rootElement.children[2].innerHTML).toBe('2');
            });

            // TODO: cover array changing length w/ previous Observables present
        });
    });

    describe('Promises', () => {
        test('Text', (done) => {
            // 1 assertion to be run
            expect.assertions(1);

            const promise = Promise.resolve('Text');
            const App = () => promise;
            Recks.render(<App />, rootElement);

            // waiting for promise to resolve
            // NOTE: this is a hack, since we're relying on ".thenned" component
            // rendering promise to be handled before this one
            promise.then(() => {
                expect(rootElement.innerHTML).toBe('Text');
                done();
            });
        });

        // TODO: cover other node types
    });

    describe('Rx', () => {
        describe('Text', () => {
            test('single', () => {
                const App = () => of(0);

                Recks.render(<App />, rootElement);
                expect(rootElement.innerHTML).toBe('0');
            });

            test('multiple', () => {
                const App = () => of(0, 42);

                Recks.render(<App />, rootElement);
                expect(rootElement.innerHTML).toBe('42');
            });
        });

        describe('vDOM', () => {
            test('single', () => {
                const App = () => of(0).pipe(map((x) => <div>{x}</div>));

                Recks.render(<App />, rootElement);
                expect(rootElement.innerHTML).toBe('<div>0</div>');
            });

            test('updating child', () => {
                const App = () => of(0, 1, 2).pipe(map((x) => <div>{x}</div>));

                Recks.render(<App />, rootElement);
                expect(rootElement.innerHTML).toBe('<div>2</div>');
            });

            test('updating tag', () => {
                const App = () =>
                    range(1, 6).pipe(
                        map((x) => Recks.createElement('h' + x, void 0, x)),
                    );

                Recks.render(<App />, rootElement);
                expect(rootElement.innerHTML).toBe('<h6>6</h6>');
            });

            // TODO: cover attributes
        });

        describe('Arrays', () => {
            test('one element', () => {
                const App = () => of([<h1 key="one">hello</h1>]);
                Recks.render(<App />, rootElement);
                expect(rootElement.innerHTML).toBe('<h1>hello</h1>');
            });

            test('two elements ONLY', () => {
                const App = () =>
                    of([
                        <h1 key="one">hello</h1>,
                        <h1 key="two">world</h1>,
                        <h1 key="tre">!</h1>,
                    ]);
                Recks.render(<App />, rootElement);
                expect(rootElement.innerHTML).toBe(
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

                Recks.render(<App />, rootElement);
                expect(rootElement.innerHTML).toBe(
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

                Recks.render(<App />, rootElement);
                expect(rootElement.innerHTML).toBe('<h2>0</h2><h2>1</h2>');
            });

            describe.skip('!!!UNSTABLE: Same ref updates!!!', () => {
                // NOTE: currently neither arrays nor elements are cloned inside
                // the engine. Therefore if an element or an array is reused
                // among renders -- its imposible to compare new emission to
                // older emission. The engine should probably throw an exception
                // in these cases.
                //
                // These tests ensure that behavior until engine is refactored.

                // vDOM

                // Current behavior:
                // renews prop every time
                // Expected behavior:
                // should throw
                test('vDOM props', () => {
                    const props = { title: '' };
                    const element = Recks.createElement('div', props, 1);
                    const App = () =>
                        of(0, 1, 2).pipe(
                            map((i) => {
                                element.props.title += i;
                                return element;
                            }),
                        );

                    Recks.render(<App />, rootElement);
                    expect(rootElement.children[0].getAttribute('title')).toBe(
                        '012',
                    );
                });

                // SUBCOMPONENT

                // Current behavior:
                // doesn't push new updates
                // Expected behavior:
                // should throw
                xtest('subcomponent', () => {
                    const Child = (props$: Observable<any>) => {
                        return props$.pipe(
                            map((props) => <div title={props.title}></div>),
                        );
                    };

                    const props = { title: '' };
                    const element = Recks.createElement(Child, props, 1);

                    const App = () =>
                        of(0, 1, 2).pipe(
                            map((i) => {
                                element.props.title += i;
                                return element;
                            }),
                        );

                    Recks.render(<App />, rootElement);
                    expect(rootElement.children[0].getAttribute('title')).toBe(
                        '0',
                    );
                });

                // ARRAY

                // Current behavior:
                // doesn't render new updates
                // Expected behavior:
                // should throw
                test('array', () => {
                    const arr = [];
                    const App = () =>
                        of('a', 'b', 'c').pipe(
                            map((i) => {
                                arr.push(<div key={i}>{i}</div>);
                                return arr;
                            }),
                        );

                    Recks.render(<App />, rootElement);
                    expect(arr.length).toBe(3);
                    expect(rootElement.children.length).toBe(1);
                    expect(rootElement.children[0].innerHTML).toBe('a');
                });
            });
        });
    });
});
