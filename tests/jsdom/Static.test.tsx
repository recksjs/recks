import { of, Subject } from 'rxjs';
import { Recks } from '../../src/index';
import { createTestRoot } from './helpers';

describe('Static', () => {
    const root = createTestRoot();

    test('Simple', () => {
        Recks.render(<div>Hi</div>, root.el);
        expect(root.el.innerHTML).toBe('<div>Hi</div>');
    });

    test('With attribute', () => {
        Recks.render(<div title="So">Ho</div>, root.el);
        expect(root.el.innerHTML).toBe('<div title="So">Ho</div>');
    });

    describe('Observable', () => {
        test('sync params', () => {
            const title$ = of('a');
            const alt$ = of(0);
            Recks.render(<span title={title$} alt={alt$} />, root.el);
            expect(root.el.innerHTML).toBe('<span title="a" alt="0"></span>');
        });

        test('async params', () => {
            const title$ = new Subject();
            const alt$ = new Subject();

            Recks.render(<span title={title$} alt={alt$} />, root.el);
            expect(root.el.innerHTML).toBe('<span></span>');

            title$.next('a');
            expect(root.el.innerHTML).toBe('<span title="a"></span>');

            alt$.next('0');
            expect(root.el.innerHTML).toBe('<span title="a" alt="0"></span>');

            title$.next('b');
            expect(root.el.innerHTML).toBe('<span title="b" alt="0"></span>');
        });

        test('sync children', () => {
            const title$ = of('a');
            const alt$ = of(0);
            Recks.render(
                <span>
                    {title$}
                    {alt$}
                </span>,
                root.el,
            );
            expect(root.el.innerHTML).toBe('<span>a0</span>');
        });

        test('async children', () => {
            const title$ = new Subject();
            const alt$ = new Subject();

            Recks.render(
                <span>
                    {title$}
                    {alt$}
                </span>,
                root.el,
            );
            expect(root.el.innerHTML).toBe('<span></span>');

            // NOTE: no early rendering till every child emits
            title$.next('a');
            expect(root.el.innerHTML).toBe('<span></span>');

            alt$.next('0');
            expect(root.el.innerHTML).toBe('<span>a0</span>');

            title$.next('b');
            expect(root.el.innerHTML).toBe('<span>b0</span>');
        });
    });
});
