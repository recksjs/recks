# Install

### **Zero** setup

You can try the framework right now in the [**Online Playground**](https://codesandbox.io/s/recks-example-greeting-input-tu6tp)\*\*\*\*

### Easy setup

You can start a new project with a [template repo](https://github.com/recksjs/recks-starter-project):

```bash
git clone https://github.com/recksjs/recks-starter-project.git
cd recks-starter-project
npm i
npm start
```

It's a webpack-based setup with latest Recks and RxJS.

### Custom setup

To setup the project yourself, you'll need to install packages

```bash
npm i recks rxjs
```

**NOTE:** To properly handle the JSX elements you need to set up `pragma` to use `Recks` name. See [Babel docs](https://babeljs.io/docs/en/babel-preset-react#pragma) for details.

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

Please, refer to [template project](https://github.com/recksjs/recks-starter-project) sources for details.

