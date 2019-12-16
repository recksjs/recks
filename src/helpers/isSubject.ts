import { Subject } from 'rxjs';

export function isSubject(v): v is Subject<unknown> {
    return v && typeof v.next == 'function';
}