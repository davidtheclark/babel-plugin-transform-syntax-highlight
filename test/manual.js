const React = require('react');
const ReactDOM = require('react-dom');
// import highlight from 'babel-plugin-transform-syntax-highlight/highlight';
const highlight = require('babel-plugin-transform-syntax-highlight/highlight');

const highlightJsCss = document.createElement('link');
highlightJsCss.rel = 'stylesheet';
highlightJsCss.href =
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/agate.min.css';
document.head.appendChild(highlightJsCss);

const prismCss = document.createElement('link');
prismCss.rel = 'stylesheet';
prismCss.href =
  'https://cdnjs.cloudflare.com/ajax/libs/prism/1.6.0/themes/prism-coy.min.css';
document.head.appendChild(prismCss);

{
  const a = highlight.html({ language: 'javascript' }, `
    const foo = 'bar';
    const bar = '{# props.bar #}';
  `);
  const containerA = document.createElement('div');
  containerA.innerHTML = a({ bar: 'xxx' });
  document.body.appendChild(containerA);
}

const SomeCode = highlight.react({ language: 'javascript', highlight: 'prism' }, `
  const foo = "bar";
  const bar = "{# props.bar #}";
`);

const containerB = document.createElement('div');
document.body.appendChild(containerB);
ReactDOM.render(
  <div>
    <SomeCode bar="yyy" />
  </div>,
  containerB
);
