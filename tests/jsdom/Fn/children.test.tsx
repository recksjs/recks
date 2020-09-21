import { of, Subject } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Recks } from '../../../src/index';
import { createTestRoot } from '../helpers';

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
});
