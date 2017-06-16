# babel-plugin-transform-syntax-highlight

[![Build Status](https://travis-ci.org/davidtheclark/babel-plugin-transform-syntax-highlight.svg?branch=master)](https://travis-ci.org/davidtheclark/babel-plugin-transform-syntax-highlight)

Performs syntax highlighting of string and template literals *during Babel compilation*, rather than at runtime.

Transforms a special function call into one of the following:
- HTML mode: A function expression for a function that returns a template literal.
- React mode: A stateless functional React component.

In both cases, you can provide delimited placeholders within the code string that can be interpreted at runtime, when you invoke the function or create a React element from the component.

## Usage

`require` or `import` 'babel-plugin-transform-syntax-highlight/highlight', or whatever you've specified as `packageName` in your Babel options.

Now you have an object with `react` and `html` functions.
Those functions accept two arguments: `options` and `code`.
(`options` is optional.)

The `react` function returns a React component, whose props can be used for interpolation.

The `html` function returns a function that accepts a `props` argument, which can be used for interpolation.

React mode example:

```jsx
// Input:
const highlight = require('babel-plugin-transform-syntax-highlight/highlight');
// Or import highlight from 'babel-plugin-transform-syntax-highlight/highlight';
const SomeCode = highlight.react({
  language: 'javascript',
  highlight: 'prism'
}, `
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

HTML mode example:

```js
// Input:
const highlight = require('babel-plugin-transform-syntax-highlight/highlight');
// Or import highlight from 'babel-plugin-transform-syntax-highlight/highlight';
const someCode = highlight.html(`
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

### Plugin options

When you add the plugin to your Babel configuration, you can pass these options:

- **packageName** `string` - Default: 'babel-plugin-transform-syntax-highlight/highlight'.
  The name of the package that you will `require` or `import`.
- **highlight** `'highlightjs' | 'prism'` - Default: `'highlight'`.
  Choose the highlighter that you'd like to use, either [highlight.js](https://github.com/isagalaev/highlight.js) or [Prism](http://prismjs.com/).
  **Make sure you include CSS for the highlighter in your page.**
- **delimiters** `[string, string]` - Default: `['{#', '#}']`.
  Delimiters for marking placeholders in the code that can later be replaced at runtime, either by props (in React mode) or function arguments (in HTML mode).
  If you don't use the default, make sure to choose delimiters that will not clash with the language of the code to be highlighted.
  And do not use `<` and `>`, which will be escaped by the syntax highlighter.

For example:

```js
// .babelrc
{
  "plugins": [
    "transform-syntax-highlighting",
    {
      "packageName": "babel-highlighting",
      "highlight": "prism",
      "delimiters": ["$$", "$$"]
    }
  ]
}
```

### Invocation options

When you invoke the `html` or `react` functions, the first argument can be an options object.
That object can include the following:

- **language** `string` - A language identifier that your highlighter of choice will understand.
  If no value is provided, highlight.js will try to guess the language. Prism will return an unhighlighted code.
- **highlight** - Same as the Babel option, above.
  But overrides whatever Babel option has been set.
- **delimiters** - Same as the Babel option, above.
  But overrides whatever Babel option has been set.

### Notes

- Interpolation happens at runtime, not before syntax highlighting.
  For this reason, your interpolations should only be strings or numbers.
  Strings and numbers should be correctly interpreted by syntax highlighters (I think).
