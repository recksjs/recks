import { Recks } from '../../src/index';
import { of, timer, Subject } from 'rxjs';
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

        test('Dynamic input props', (done) => {
            const App = () => {
                const title$ = of('Green', 'Blue', 'Yellow');
                return <div title={ title$ }>Submarine</div>;
            }

            Recks.render(<App />, rootElement);

            setTimeout(()=>{
                expect(rootElement.children[0].innerHTML).toBe('Submarine');
                expect(rootElement.children[0].getAttribute('title')).toBe('Yellow');
                done();
            }, 30)
        });

        test.only('Dynamic output props', () => {
            const onClick$ = {
                next: jest.fn()
            };

            const App = (_, { destroy$ }) => {
                return <button onClick={ onClick$ }>Click me!</button>;
            }

            Recks.render(<App />, rootElement);

            const buttonElement = rootElement.children[0];
            const event = document.createEvent("HTMLEvents");
            event.initEvent('click', false, true);
            buttonElement.dispatchEvent(event);

            expect(onClick$.next.mock.calls.length).toBe(1);
        })

    });

})