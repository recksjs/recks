# Intro to RecksJS

[![NPM](https://img.shields.io/npm/v/recks)](https://www.npmjs.com/package/recks) [![Bundlephobia](https://img.shields.io/bundlephobia/minzip/recks?label=gzipped)](https://bundlephobia.com/result?p=recks@latest) [![MIT license](https://img.shields.io/npm/l/recks)](https://opensource.org/licenses/MIT)

> Official docs: [**recks.gitbook.io**](https://recks.gitbook.io)

RecksJS is a **framework based on streams**

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

Try it in this [**online sandbox**](https://codesandbox.io/s/recks-example-greeting-input-tu6tp?file=/src/App.jsx) or [**install locally**](https://recks.gitbook.io/recks/install)

⚠️ RecksJS is currently in beta

## 🔎 Overview

Observables are first class citizens in Recks ❤️

```jsx
function App(){
  return <div>{ timer(0, 1000) }</div>
}
```

You can also do other way around: map a stream on JSX

```jsx
function App(){
  return timer(0, 1000).pipe(
    map(x => <div>{ x }</div>)
  );
}
```

_Recks will subscribe to and unsubscribe from provided streams automatically, you don't have to worry about that!_

And you can use Promises that will display a result, once resolved:

```jsx
function App(){
  const result = axios.get(url).then(r => r.data);

  return <div>
    { result }
  </div>
}
```

To get a better understanding of Recks concepts, read this article: ["Intro to Recks: Rx+JSX experiment"](https://dev.to/kosich/recks-rxjs-based-framework-23h5) and check out [API](https://recks.gitbook.io/recks/api/) docs section

## 📖 Examples

### 1. Hello world

Just a basic, no "moving parts"

```jsx
import Recks from 'recks';

function App() {
  return <h1>Hello world!</h1>
}
```

### 2. Timer

RxJS' timer here will emit an integer every second, updating the view

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

### 3. Greeting

Uses a simple [Subject](https://rxjs.dev/api/index/class/Subject) to store local component state:

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

### 4. Counter

Traditional counter example with a [Subject](https://rxjs.dev/api/index/class/Subject):

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

## 📚 Docs

* [Installation guide](https://recks.gitbook.io/recks/install)

### API

* [Lifecycle](https://recks.gitbook.io/recks/api/lifecycle)
* [Events](https://recks.gitbook.io/recks/api/events)
* [Subcomponents](https://recks.gitbook.io/recks/api/subcomponents)
* [Lists](https://recks.gitbook.io/recks/api/lists)
* [DOM references](https://recks.gitbook.io/recks/api/dom-references)

