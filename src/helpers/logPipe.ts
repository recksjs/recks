import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

// a helper to debug
export function log<T>(prefix?: string) {
    return (o: Observable<T>) => o.pipe(
        tap(x => console.log(prefix, x))
    )
}
