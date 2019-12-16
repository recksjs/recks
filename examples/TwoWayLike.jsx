import Re from '../index';
import { Subject } from 'rxjs';
import { startWith } from 'rxjs/operators';

function TwoWayLike() {
    const name$ = new Subject();
    const view$ = name$.pipe( startWith('') );

    return <div>
        <input onInput={ e => name$.next(e.target.value) } />
        { view$ }
    </div>
}

export { TwoWayLike }