import { of, Subject } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Recks } from '../../../src/index';

describe('Children', () => {
    let rootElement: HTMLElement;

    beforeEach(() => {
        rootElement = document.createElement('div');
        document.body.appendChild(rootElement);
    });

    afterEach(() => {
        document.body.removeChild(rootElement);
    });

    test('null to component', () => {
        const P = () => {
            return of(null, <span>one</span>, null, <span>two</span>);
        };

        Recks.render(<P />, rootElement);
        expect(rootElement.innerHTML).toBe('<span>two</span>');
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

        Recks.render(<P />, rootElement);
        expect(rootElement.children[0].children[1].innerHTML).toBe('');
        source$.next(true);
        expect(rootElement.children[0].children[1].innerHTML).toBe(
            '<h1>true</h1>',
        );
        source$.next(false);
        expect(rootElement.children[0].children[1].innerHTML).toBe(
            '<h1>false</h1>',
        );
        source$.next(true);
        expect(rootElement.children[0].children[1].innerHTML).toBe(
            '<h1>true</h1>',
        );
    });

    describe('Observable params', () => {
        describe('Static elements', () => {
            test('Single param', () => {
                const title$ = new Subject();

                const P = () => <span title={title$} />;

                Recks.render(<P />, rootElement);
                expect(rootElement.innerHTML).toBe('<span></span>');

                title$.next('a');
                expect(rootElement.innerHTML).toBe('<span title="a"></span>');

                title$.next('b');
                expect(rootElement.innerHTML).toBe('<span title="b"></span>');
            });

            test('Mixed', () => {
                const title$ = new Subject();
                const alt$ = new Subject();

                const P = () => (
                    <span title={title$} alt={alt$} data="data" hello="world" />
                );

                Recks.render(<P />, rootElement);
                expect(rootElement.innerHTML).toBe(
                    '<span data="data" hello="world"></span>',
                );

                title$.next('el-title');
                expect(rootElement.innerHTML).toBe(
                    '<span data="data" hello="world" title="el-title"></span>',
                );

                alt$.next('alt text');
                expect(rootElement.innerHTML).toBe(
                    '<span data="data" hello="world" title="el-title" alt="alt text"></span>',
                );
            });
        });
    });
});
