import { Recks } from '../../../src/index';
import { Subject, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

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
});
