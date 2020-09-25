import { Observable } from 'rxjs';
import { createElement } from './engine/Element';
import { render } from './engine/render';

const Recks = { createElement, render };

declare namespace Recks {
    namespace JSX {
        /**
         * Type of attributes in <Foo bar={ 42 } /> is derived from Foo component definition
         *
         * ```ts
         * function Foo(props: Observable<{ bar: number }>) {
         * ```
         *
         * Or if props is any -- any attribute is allowed
         *
         * ```ts
         * function Foo(props: any) {
         * ```
         *
         * Other types for props would disallow attributes, other then library default
         */
        type LibraryManagedAttributes<_, Props> = Props extends Observable<
            infer O
        >
            ? O & DefaultAttributes // O as in Observable<O>
            : Props extends all // if Props has type defined, then
            ? EmptyProps & DefaultAttributes // no props should be allowed
            : any; // otherwise Props itself is any, so we allow any attributes

        interface EmptyProps {}

        interface DefaultAttributes {
            key?: string | number | boolean | Symbol | bigint;
        }

        // `all` is virtually every type in TS
        // it let's us test if type is of type `any`:
        // when T doesn't extend `all`, then it extends `any`
        type all =
            | { [key: string]: any }
            | string
            | number
            | bigint
            | boolean
            | Symbol
            | void;
    }
}

export { Recks, createElement, render };
export default Recks;
