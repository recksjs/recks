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
To try the framework use this [Online Sandbox](https://codesandbox.io/s/recks-example-greeting-input-tu6tp?fontsize=14&hidenavigation=1&theme=dark) or see the [Installation Guide](install.md)
{% endhint %}

## Intro

Observables are first class citizens in Recks!

To get a better understanding of Recks concepts, check out this article: [https://dev.to/kosich/recks-rxjs-based-framework-23h5](https://dev.to/kosich/recks-rxjs-based-framework-23h5)

## Examples

### 1. Hello world

```jsx
import Recks from 'recks';

function App() {
  return <h1>Hello world!</h1>
}
```

### 2. A Timer

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

[online sandbox](https://codesandbox.io/s/recks-example-timer-fjyvj?fontsize=14&hidenavigation=1&theme=dark&module=/src/App)

### 3. A Greeting

Use a simple [Subject](https://rxjs.dev/api/index/class/Subject) to store local component state:

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

[online sandbox](https://codesandbox.io/s/recks-example-greeting-input-tu6tp?fontsize=14&hidenavigation=1&theme=dark&module=/src/App)

### 4. A Counter

Traditional counter example

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

[online sandbox](https://codesandbox.io/s/recks-example-counter-lw29e?fontsize=14&hidenavigation=1&theme=dark&module=/src/App)

### 5. DOM Refs

...

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

[online sandbox](https://codesandbox.io/s/recks-example-input-ref-ye5so?fontsize=14&hidenavigation=1&theme=dark&module=/src/App)

### 6. Subcomponents

...

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

[online sandbox](https://codesandbox.io/s/recks-example-cat-mouse-hnr41?fontsize=14&hidenavigation=1&theme=dark&module=/src/App)

### 7. Lists

```jsx
import Recks from 'recks';

function List () {
    const items = ['a', 'b', 'c', 'd'];
    return <ul>{
        items.map(letter => <li key={letter}>{letter}</li>)
    }</ul>
}

export { List }
```

{% hint style="info" %}
Lists require each child to have a key and that key to be unique
{% endhint %}

