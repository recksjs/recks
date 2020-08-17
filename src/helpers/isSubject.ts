import { Subject } from 'rxjs';
import { isFunction } from './isFunction';

export function isSubject(v): v is Subject<unknown> {
    return v && isFunction(v.next);
}
