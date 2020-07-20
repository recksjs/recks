# Install

{% hint style="info" %}
You can try the framework in a [sandbox](https://codesandbox.io/s/recks-example-greeting-input-tu6tp?fontsize=14&hidenavigation=1&theme=dark)
{% endhint %}

### Easy setup

You can start a new project with a [template repo](https://github.com/recksjs/recks-starter-project):

```bash
git clone https://github.com/recksjs/recks-starter-project.git
cd recks-starter-project
npm i
npm start
```

### Custom setup

```bash
npm i recks rxjs
```

Then to mount framework in your `index.js`

```jsx
import Recks from 'recks';

Recks.render(
  Recks.createElement(App),       // root component 
  document.getElementById('root') // mounting element
);

function App() {
  return <h1>Hello world!</h1>
}
```

**NOTE:** To properly handle the JSX elements you need to set up `pragma` to use `Recks` name. See [Babel docs](https://babeljs.io/docs/en/babel-preset-react#pragma) for details.

