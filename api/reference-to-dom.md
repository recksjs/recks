# Reference to DOM

To interact with actual DOM Element — you need to acquire a reference to it. To get a reference, you can create a Subject and pass that subject to special ref property on JSX element:

```jsx
import Recks from 'recks';
import { Subject } from 'rxjs';

function App() {
  const ref$ = new Subject();

  ref$.subscribe(ref => {
    ref.style.background = 'magenta';
  });

  return <div ref={ref$}>Hello!</div>;
}
```

[online sandbox](https://codesandbox.io/s/recks-basic-ref-mvysf?file=/src/App.jsx)

If DOM tree is updated **`ref$`** will emit a reference to the new DOM element.

{% hint style="info" %}
**`NOTE: ref$`** will automatically complete with the component
{% endhint %}

### Focus example

Here's a more sophisticated example with a Button, focusing Input on click:

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
      <button onClick={ ()=>clicks$.next(null) }>
        Focus the input
      </button>
    </div>
  );
}
```

[online sandbox](https://codesandbox.io/s/recks-example-input-ref-ye5so?fontsize=14&hidenavigation=1&theme=dark&module=/src/App)

