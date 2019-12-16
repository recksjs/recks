import Re from '../index';
import { timer } from 'rxjs';
import { map } from 'rxjs/operators';


function Parent () {
    return <div>{
        timer(0, 1000).pipe(
            map(i => <Child index={i} />)
        )
    }</div>
}

function Child (props$) {
    const animal$ = props$.pipe(
        map(props => props.index + (props.index % 2 ? '🐱' : '🐭') )
    )

    return <h1 style="text-align: center;">{animal$}</h1>
}

export { Parent, Child }