import Re from '../index';

function List () {
    const items = ['a', 'b', 'c', 'd'];
    return <ul>{
        items.map(letter => <li key={letter}>{letter}</li>)
    }</ul>
}

export { List }