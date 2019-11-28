import Re from '../index';
import { timer } from 'rxjs';

function Timer () {
    const tick$ = timer(0, 1000)

    return <div>{ tick$ }</div>
}

export { Timer }