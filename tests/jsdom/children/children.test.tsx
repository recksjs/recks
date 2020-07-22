import { Recks } from '../../../src/index';
import { Subject, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

describe('Children', () => {
    let rootElement: HTMLElement;

    beforeEach(() => {
        rootElement = document.createElement('div');
        document.body.appendChild(rootElement);
    });

    afterEach(()=>{
        document.body.removeChild(rootElement);
    });

    test('null to component', () => {
        const P = () => {
            return of(null, <span>one</span>, null, <span>two</span>)
        };

        Recks.render(<P />, rootElement);
        expect(rootElement.innerHTML).toBe('<span>two</span>');
    });

    // TODO: ENABLE AFTER PREV TEST RUNNING
    test('switching between children', () => {
        const s$ = new Subject();
        const True = () => <h1>true</h1>;
        const False = () => <h1>false</h1>;
        const P = () => {
            return <div>
                <div>
                    <span>True</span>
                    -
                    <span>False</span>
                </div>
                <div>
                    {s$.pipe(map(x => x ? <True /> : <False />), startWith(null))}
                </div>
            </div>
        };

        Recks.render(<P />, rootElement);
        expect(rootElement.children[0].children[1].textContent).toBe('');
        s$.next(true);
        expect(rootElement.children[0].children[1].textContent).toBe('true');
        s$.next(false);
        expect(rootElement.children[0].children[1].textContent).toBe('false');
        s$.next(true);
        expect(rootElement.children[0].children[1].textContent).toBe('true');
    });

})