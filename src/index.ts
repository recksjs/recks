import { Observable } from 'rxjs';
import { createElement } from './engine/Element';
import { render } from './engine/render';

const Recks = { createElement, render };

declare namespace Recks {
    namespace JSX {
        type LibraryManagedAttributes<
            Component,
            Props
        > = Props extends Observable<infer O> ? O : Props;
    }
}

export { Recks, createElement, render };
export default Recks;
