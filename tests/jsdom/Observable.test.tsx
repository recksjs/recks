import { Observable, of, range, Subject } from 'rxjs';
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

    test('dropping observable subscription', () => {
        const app$ = new Subject();
        const o1sub = jest.fn();
        const o1 = new Observable((observer) => {
            observer.next(<span>o1</span>);
            return o1sub;
        });
        Recks.render(app$, root.el);
        app$.next('before');
        expect(root.el.innerHTML).toBe('before');
        app$.next(o1);
        expect(root.el.innerHTML).toBe('<span>o1</span>');
        app$.next('after');
        expect(root.el.innerHTML).toBe('after');
        expect(o1sub.mock.calls.length).toBe(1);
    });

    describe('Text', () => {
        test('single', () => {
            const o = of(0);
            Recks.render(o, root.el);
            expect(root.el.innerHTML).toBe('0');
        });

        test('multiple', () => {
            const o = of(0, 42);
            Recks.render(o, root.el);
            expect(root.el.innerHTML).toBe('42');
        });
    });

    describe('vDOM', () => {
        test('single', () => {
            const o = of(0).pipe(map((x) => <div>{x}</div>));
            Recks.render(o, root.el);
            expect(root.el.innerHTML).toBe('<div>0</div>');
        });

        test('updating child', () => {
            const o = of(0, 1, 2).pipe(map((x) => <div>{x}</div>));

            Recks.render(o, root.el);
            expect(root.el.innerHTML).toBe('<div>2</div>');
        });

        test('updating tag', () => {
            const o = range(1, 6).pipe(
                map((x) => Recks.createElement('h' + x, void 0, x)),
            );

            Recks.render(o, root.el);
            expect(root.el.innerHTML).toBe('<h6>6</h6>');
        });
    });

    describe('Arrays', () => {
        test('one element', () => {
            const o = of([<h1 key="one">hello</h1>]);
            Recks.render(o, root.el);
            expect(root.el.innerHTML).toBe('<h1>hello</h1>');
        });

        test('two elements', () => {
            const o = of([
                <h1 key="one">hello</h1>,
                <h1 key="two">world</h1>,
                <h1 key="tre">!</h1>,
            ]);
            Recks.render(o, root.el);
            expect(root.el.innerHTML).toBe(
                '<h1>hello</h1><h1>world</h1><h1>!</h1>',
            );
        });

        test('increasing length', () => {
            const o = of(1, 2, 3).pipe(
                map((i) =>
                    new Array(i)
                        .fill(undefined)
                        .map((_, j) => <div key={j}>{j}</div>),
                ),
            );

            Recks.render(o, root.el);
            expect(root.el.innerHTML).toBe(
                '<div>0</div><div>1</div><div>2</div>',
            );
        });

        test('random length', () => {
            const o = of(3, 1, 2).pipe(
                map((i) =>
                    new Array(i)
                        .fill(undefined)
                        .map((_, j) =>
                            Recks.createElement('h' + i, { key: j }, j),
                        ),
                ),
            );

            Recks.render(o, root.el);
            expect(root.el.innerHTML).toBe('<h2>0</h2><h2>1</h2>');
        });
    });
});
