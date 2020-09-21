import { Observable } from 'rxjs';

export = Recks;
export as namespace Recks;

declare namespace Recks {
    namespace JSX {
        type LibraryManagedAttributes<
            Component,
            Props
        > = Props extends Observable<infer O> ? O : Props;
    }
}
