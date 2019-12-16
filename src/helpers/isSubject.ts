import { Subject } from 'rxjs';

export function isSubject(v): v is Subject<any> {
    return v && typeof v.next == 'function';
}