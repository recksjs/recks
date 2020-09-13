import { Observable, ReplaySubject } from 'rxjs';

// returns a pair [callback, subject] that help with handling destruction
export function createDestroyer(): [() => void, Observable<void>] {
    const destroy$ = new ReplaySubject<void>(1);
    const destroy = () => {
        destroy$.next(void 0);
        destroy$.complete();
    }

    return [destroy, destroy$.asObservable()];
}
