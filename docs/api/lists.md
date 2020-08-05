# Lists

To create a list of elements — map your array on a JSX element, String, or Observable

{% hint style="warning" %}
Lists **require** each child to have a **unique key** for rendering
{% endhint %}

```jsx
import Recks from 'recks';

function App() {
  const items = ['a', 'b', 'c', 'd'];

  return <ul>{
    items.map(letter => <li key={letter}>{letter}</li>)
  }</ul>
}
```



