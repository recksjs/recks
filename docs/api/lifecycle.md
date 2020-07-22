# Lifecycle

### Automatic subscription

When you use an Observable in your component, e.g.:

```jsx
function App(){
  return <div>{ timer(0, 1000) }</div>
}
```

Recks will automatically subscribe to that stream when the Component is **mounted** and will unsubscribe from it when the Component is **unmounted**.

### destroy$

Additionally, you can utilize lifecycle stream, that emits on Component unmount. It emits once and then completes.

```jsx
function App(props, { destroy$ }){
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

