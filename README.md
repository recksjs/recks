---
description: A framework based on streams.
---

# Welcome to RecksJS!

Here's a quick example:

```jsx
import Recks from 'recks';
import { timer } from 'rxjs';

function Timer() {
  const ticks$ = timer(0, 1000);

  return <div>
    <h1>{ ticks$ }</h1>
    <p>seconds passed</p>
  </div>
}
```

{% hint style="info" %}
To try the framework use this [online sandbox](https://codesandbox.io/s/recks-example-greeting-input-tu6tp?fontsize=14&hidenavigation=1&theme=dark) or see [installation guide](install.md)
{% endhint %}

## Intro

To get a better understanding of Recks concepts, read this article: [https://dev.to/kosich/recks-rxjs-based-framework-23h5](https://dev.to/kosich/recks-rxjs-based-framework-23h5)

## Examples

### 1. Hello world

```jsx
import Recks from 'recks';

function App() {
  return <h1>Hello world!</h1>
}
```

### 2. A Timer

[online sandbox](https://codesandbox.io/s/recks-example-timer-fjyvj?fontsize=14&hidenavigation=1&theme=dark&module=/src/App)

```jsx
import Recks from 'recks';
import { timer } from 'rxjs';

function Timer() {
  const ticks$ = timer(0, 1000);

  return <div>
    <h1>{ ticks$ }</h1>
    <p>seconds passed</p>
  </div>
}
```

### 3. A Greeting

[online sandbox](https://codesandbox.io/s/recks-example-greeting-input-tu6tp?fontsize=14&hidenavigation=1&theme=dark&module=/src/App)

```jsx
import Recks from 'recks';
import { Subject } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

function Greeting() {
  const name$ = new Subject();
  const view$ = name$.pipe(
    map(x => x ? `Hello, ${x}!` : ''),
    startWith('')
  );

  return <div>
    <input
      placeholder="enter your name"
      onInput={e => name$.next(e.target.value)}
    />
    { view$ }
  </div>
}
```

### 3. A Counter

[online sandbox](https://codesandbox.io/s/recks-example-counter-lw29e?fontsize=14&hidenavigation=1&theme=dark&module=/src/App)

```jsx
import Recks from 'recks';
import { Subject } from 'rxjs';
import { scan, startWith } from 'rxjs/operators';

function Counter () {
  const input$ = new Subject();
  const view$  = input$.pipe(
      startWith(0),
      scan((acc, curr) => acc + curr)
    );

  return <div>
    <button onClick={ ()=>input$.next(-1) }>minus</button>
    { view$ }
    <button onClick={ ()=>input$.next( 1) }>plus</button>
  </div>
}
```

### 4. DOM Refs

[online sandbox](https://codesandbox.io/s/recks-example-input-ref-ye5so?fontsize=14&hidenavigation=1&theme=dark&module=/src/App)

```jsx
import Recks from 'recks';
import { Subject } from 'rxjs';
import { withLatestFrom, takeUntil } from 'rxjs/operators';

function TextInputWithFocusButton(props$, { destroy$ }) {
  const ref$    = new Subject();
  const clicks$ = new Subject();

  clicks$
    .pipe(
      withLatestFrom(ref$, (_, ref) => ref),
      takeUntil(destroy$)
    )
    .subscribe(ref => {
      ref.focus();
    });

  return (
    <div>
      <input  ref={ref$} type="text" />
      <button onClick={ ()=>clicks$.next(null) }>Focus the input</button>
    </div>
  );
}
```

### 5. Subcomponents

[online sandbox](https://codesandbox.io/s/recks-example-cat-mouse-hnr41?fontsize=14&hidenavigation=1&theme=dark&module=/src/App)

```jsx
import Recks from 'recks';
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
    map(props => props.index % 2 ? '🐱' : '🐭')
  )

  return <h1 style="text-align: center;">{animal$}</h1>
}
```

### 6. Lists

```jsx
import Re from '../index';

function List () {
    const items = ['a', 'b', 'c', 'd'];
    return <ul>{
        items.map(letter => <li key={letter}>{letter}</li>)
    }</ul>
}

export { List }
```

