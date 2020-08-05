# Lifecycle

Unlike React components, in Recks component function is executed **only once** in a given component lifetime:

```jsx
function App() {
  console.log('🦄'); // <- only once per component!

  return <div>...</div>
}
```

This means that it's safe to create Subjects here to store component state, for example

```jsx
function App() {
  // create local state Subject
  const state$ = new Subject();
  const onClick = () => state$.next(+1);

  return <div>
    ...
    <button onClick={ onClick }>btn</button>
    ...
  </div>
}
```

### Updates

All incoming property updates are provided via **props$** — an Observable, passed as a first argument to your component. See [Subcomponents](subcomponents.md) section for details.

And only **you** control the output updates by placing your Observables where needed!

### Automatic subscription

When you use an Observable anywhere in your component:

```jsx
function App() {
  return <div>{ timer(0, 1000) }</div>
}
```

Recks will automatically subscribe to that stream when the Component is **mounted** and will unsubscribe from it when the Component is **unmounted**. You don't have to worry about that!

### destroy$

Additionally, you can utilize lifecycle stream, that emits on Component unmount. It emits once and then completes.

```jsx
function App(props, { destroy$ }) {
  // do custom sideeffects
  timer(0, 1000).pipe(
    takeUntil(destroy$)
  )
  .subscribe(t => {
    console.log('ping @ ' + t);
  });

  return <div>Hello!</div>
}
```

