# Events

To listen to DOM events you simply need to prepend event name with `on` prefix:

```jsx
<button
  onClick={ handler }
>
  click me
</button>
```

`handler` would receive native [Event](https://developer.mozilla.org/en-US/docs/Web/API/Event).

{% hint style="info" %}
**NOTE:** [DOM event list](https://developer.mozilla.org/en-US/docs/Web/Events) on MDN
{% endhint %}

### Events and Subjects

The best way to use events in you Recks components — is to push them into a local RxJS Subject:

```jsx
function App() {
  // events stream
  const input$ = new Subject();

  // accumulating stream
  const times$ = input$.pipe(
    startWith(0),
    scan(acc => ++acc)
  );

  return (
      <button onClick={ () => input$.next() }>
        Clicks: { times$ }
      </button>
  );
}
```

[online sandbox](https://codesandbox.io/s/events-example-3lvqc?file=/src/App.jsx)

