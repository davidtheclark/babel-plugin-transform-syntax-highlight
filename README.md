# babel-plugin-transform-syntax-highlight

🚧 🚧 **EXPERIMENTAL! WORK IN PROGRESS!** 🚧 🚧

## The goal

Performs syntax highlighting of code strings *during Babel compilation*, rather than at runtime.

Transforms a special function call into one of the following:
- HTML mode: A function expression for a function that returns a template literal.
- React mode: A stateless functional React component.

In both cases, you can provide delimited placeholders within the code string that can be interpreted at runtime, when you invoke the function or create a React element from the component.

React mode:

```jsx
// Input:
const highlight = require('babel-plugin-transform-syntax-highlight/highlight');
// Or import highlight from 'babel-plugin-transform-syntax-highlight/highlight';
const SomeCode = highlight.react({ language: 'javascript', highlight: 'prism' }, `
  const foo = "bar";
  const bar = "{# props.bar #}";
`);

// Output
const SomeCode = function SomeCode(props) {
  return (
    <pre>
      <code className="language-javascript">
        <span className="token keyword">const</span> foo{' '}
        <span className="token operator">=</span>{' '}
        <span className="token string">"bar"</span>
        <span className="token punctuation">;</span>{'\n'}
        <span className="token keyword">const</span> bar{' '}
        <span className="token operator">=</span>{' '}
        <span className="token string">"{props.bar}"</span>
        <span className="token punctuation">;</span>
      </code>
    </pre>
  );
}

// Usage
<SomeCode bar="something special" />;
```

HTML mode:

```js
// Input:
const highlight = require('babel-plugin-transform-syntax-highlight/highlight');
// Or import highlight from 'babel-plugin-transform-syntax-highlight/highlight';
const someCode = highlight.html({ language: 'javascript' }, `
  const foo = 'bar';
  const bar = '{# props.bar #}';
`);

// Output
const someCode = function(props) {
  return `<pre><code class="hljs"><span class="hljs-keyword">const</span> foo = <span class="hljs-string">'bar'</span>;
<span class="hljs-keyword">const</span> bar = <span class="hljs-string">'${props.bar}'</span>;</code></pre>`;
}

// Usage
myDiv.innerHTML = someCode({ bar: 'something special' });
```
