import { Observable } from 'rxjs';
import { createElement } from './engine/Element';
import { render } from './engine/render';

const Recks = { createElement, render };

declare namespace Recks {
    namespace JSX {
        /**
         * Type of attributes O in <Foo bar={ 42 } /> is derived from Foo component definition
         *
         * ```ts
         * function Foo(props: Observable<{ bar: number }>){
         *   …
         * }
         * ```
         */
        type LibraryManagedAttributes<_, Props> = Props extends Observable<
            infer O
        >
            ? O & DefaultAttributes // O as in Observable<O>
            : EmptyProps & DefaultAttributes; // empty object -aka- no props

        interface EmptyProps {}

        interface DefaultAttributes {
            key?: string | number | boolean | Symbol | bigint;
        }
    }
}

export { Recks, createElement, render };
export default Recks;
