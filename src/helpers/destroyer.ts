import { Observable, ReplaySubject } from 'rxjs';

export function destroyer(): [() => void, Observable<void>] {
    const destroy$ = new ReplaySubject<void>(1);
    const destroy = () => {
        destroy$.next(void 0);
        destroy$.complete();
    }

    return [destroy, destroy$.asObservable()];
}
