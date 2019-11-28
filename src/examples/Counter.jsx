import Re from '../index';

function Counter () {
    const state$ = new Subject();
    const value$ =
        state$.pipe(
            startWith(0),
            scan((acc, curr) => acc + curr)
        );

    return <div>
        <button onClick={() => state$.next(1)}>plus</button>
        {value$}
        <button onClick={() => state$.next(-1)}>minus</button>
    </div>
}

export { Counter }