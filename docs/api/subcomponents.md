# Subcomponents

### Basic example

Component can contain other components:

```jsx
import Recks from 'recks';

function Parent () {
  return <div>
    Hello, <Child /> !
  </div>
}

function Child () {
  return <span>child</span>
}
```

### Props

Probably you'll need to pass some properties from the parent to the child.

Each component accepts properties stream as the first argument. It's an Observable of properties from the parent. Once Parent re-renders a Child, the `props$` stream will emit another object with updated properties:

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

