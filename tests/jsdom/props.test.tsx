import { Recks } from '../../src/index';
import { of, timer } from 'rxjs';
import { mapTo } from 'rxjs/operators';

describe('Props', () => {
    let rootElement: HTMLElement;

    beforeEach(() => {
        rootElement = document.createElement('div');
        document.body.appendChild(rootElement);
    })

    afterEach(()=>{
        document.body.removeChild(rootElement);
    })

    test('vDOM on root with props', () => {
        Recks.render(<div title="Hello">World</div>, rootElement);
        expect(rootElement.children[0].getAttribute('title')).toBe('Hello');
        expect(rootElement.children[0].innerHTML).toBe('World');
    });

    describe('vDOM', () => {
        test('Static props', () => {
            const App = () => <div title="Yellow">Submarine</div>
            Recks.render(<App />, rootElement);
            expect(rootElement.children[0].innerHTML).toBe('Submarine');
            expect(rootElement.children[0].getAttribute('title')).toBe('Yellow');
        });

        // TODO: cover output props

        test.only('Dynamic input props', (done) => {
            const App = () => {
                const title$ = of('Green', 'Blue', 'Yellow');
                return <div title={ title$ }>Submarine</div>;
                // return timer(0, 10).pipe(
                //     mapTo(<div title={ title$ }>Submarine</div>)
                // )
            }

            Recks.render(<App />, rootElement);

            setTimeout(()=>{
                expect(rootElement.children[0].innerHTML).toBe('Submarine');
                expect(rootElement.children[0].getAttribute('title')).toBe('Yellow');
                done();
            }, 30)
        });

    });

})