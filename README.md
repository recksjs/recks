---
description: A framework based on streams.
---

# Intro to RecksJS

One code snippet is worth a thousand words

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
To try it, see [Online Sandbox](https://codesandbox.io/s/recks-example-greeting-input-tu6tp?file=/src/App.jsx) or [Installation Guide](install.md) 
{% endhint %}

## Overview

Observables are first class citizens in Recks ❤️

```jsx
return <div>{ interval(1000) }</div>
```

Recks will subscribe and unsubscribe from provided stream automatically, you don't have to worry about that!

Or you can do other way around: map a stream on JSX

```jsx
return interval(1000).pipe(
  map(x => <div>{ x }</div>)
)
```

Or you can use Promises that will display a result once resolved:

```jsx
const result = axios.get(url).then(r => r.data)

return <div>
  { result }
</div>
```

To get a better understanding of Recks concepts, check out this article: ["Intro to Recks: Rx+JSX experiment"](https://dev.to/kosich/recks-rxjs-based-framework-23h5)

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

Traditional counter example:

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
    <button onClick={ ()=>input$.next(-1) }>
      minus
    </button>

    { view$ }

    <button onClick={ ()=>input$.next( 1) }>
      plus
    </button>
  </div>
}
```

[online sandbox](https://codesandbox.io/s/recks-example-counter-lw29e?fontsize=14&hidenavigation=1&theme=dark&module=/src/App)

