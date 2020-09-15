import { of, Subject } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Recks } from '../../../src/index';
import { createTestRoot } from '../helpers';

// TODO: ensure param removal
// <a b={1} c={2}/>
// to
// <a />

describe('Children', () => {
    const root = createTestRoot();

    test('null to component', () => {
        const P = () => {
            return of(null, <span>one</span>, null, <span>two</span>);
        };

        Recks.render(<P />, root.el);
        expect(root.el.innerHTML).toBe('<span>two</span>');
    });

    test('switching between children', () => {
        const source$ = new Subject();
        const True = () => <h1>true</h1>;
        const False = () => <h1>false</h1>;
        const output$ = source$.pipe(
            map((x) => (x ? <True /> : <False />)),
            startWith(null),
        );

        const P = () => {
            return (
                <div>
                    <div>
                        <span>True</span>-<span>False</span>
                    </div>
                    <div>{output$}</div>
                </div>
            );
        };

        Recks.render(<P />, root.el);
        expect(root.el.children[0].children[1].innerHTML).toBe('');
        source$.next(true);
        expect(root.el.children[0].children[1].innerHTML).toBe('<h1>true</h1>');
        source$.next(false);
        expect(root.el.children[0].children[1].innerHTML).toBe(
            '<h1>false</h1>',
        );
        source$.next(true);
        expect(root.el.children[0].children[1].innerHTML).toBe('<h1>true</h1>');
    });

    describe('Observable params', () => {
        describe('Static elements', () => {
            test('Single param', () => {
                const title$ = new Subject();

                const P = () => <span title={title$} />;

                Recks.render(<P />, root.el);
                expect(root.el.innerHTML).toBe('<span></span>');

                title$.next('a');
                expect(root.el.innerHTML).toBe('<span title="a"></span>');

                title$.next('b');
                expect(root.el.innerHTML).toBe('<span title="b"></span>');
            });

            test('Mixed', () => {
                const title$ = new Subject();
                const alt$ = new Subject();

                const P = () => (
                    <span title={title$} alt={alt$} data="data" hello="world" />
                );

                Recks.render(<P />, root.el);
                expect(root.el.innerHTML).toBe(
                    '<span data="data" hello="world"></span>',
                );

                title$.next('el-title');
                expect(root.el.innerHTML).toBe(
                    '<span data="data" hello="world" title="el-title"></span>',
                );

                alt$.next('alt text');
                expect(root.el.innerHTML).toBe(
                    '<span data="data" hello="world" title="el-title" alt="alt text"></span>',
                );
            });
        });

        // NOTE: this feature is not final
        describe('EXPERIMENTAL: Fn components', () => {
            test('Static value', () => {
                const C = ({ title }) => <span title={title}></span>;
                const P = () => <C title="test" />;

                Recks.render(<P />, root.el);

                expect(root.el.innerHTML).toBe('<span title="test"></span>');
            });

            test('Dynamic value', () => {
                const value$ = new Subject();

                const C = ({ value }) => <span title={value}></span>;

                const P = () => <C value={value$} />;

                Recks.render(<P />, root.el);

                expect(root.el.innerHTML).toBe('<span></span>');

                value$.next('a');
                expect(root.el.innerHTML).toBe('<span title="a"></span>');

                value$.next('b');
                expect(root.el.innerHTML).toBe('<span title="b"></span>');
            });
        });
    });
});
