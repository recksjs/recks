import { from, isObservable, Observable, of } from 'rxjs';
import { isThenable } from './isThenable';

/**
 * Will ensure the value is Observable or will turn it into an Observable otherwise
 * NOTE: Promises will be wrapped into an Observable that emits or errors it's result
 * @param value Observable, Promise or any
 */
export function asObservable(value): Observable<unknown> {
    // an Observable
    if (isObservable(value)) {
        return value;
    }

    // a Promise
    // basically RxJS way of checking against Promise
    // https://github.com/ReactiveX/rxjs/blob/8ad3267fb337a22c383a4ff8901e03b0ae3e2a7a/src/internal/util/isPromise.ts
    if (isThenable(value)) {
        return from(value);
    }

    // otherwise
    // box in an Observable
    return of(value);
}
