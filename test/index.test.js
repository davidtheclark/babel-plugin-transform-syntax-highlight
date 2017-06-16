'use strict';

const babel = require('babel-core');
const babelEs2015 = require('babel-preset-es2015');
const babelReact = require('babel-preset-react');
const plugin = require('..');

const transform = (code, options) => {
  const pluginValue = options ? [plugin, options] : plugin;
  return babel.transform(code, {
    presets: [babelEs2015, babelReact],
    plugins: [pluginValue]
  }).code;
};

test('basic html', () => {
  const code = `
    const highlight = require('babel-plugin-transform-syntax-highlight/highlight');
    const snippet = highlight.html({ language: 'javascript' }, \`
      const foo = 'bar';
      const bar = '{# props.bar #}';
    \`);
  `;
  expect(transform(code)).toMatchSnapshot();
});

test('basic react', () => {
  const code = `
    const highlight = require('babel-plugin-transform-syntax-highlight/highlight');
    const snippet = highlight.react({ language: 'javascript' }, \`
      const foo = 'bar';
      const bar = '{# props.bar #}';
    \`);
  `;
  expect(transform(code)).toMatchSnapshot();
});

test('import instead of require', () => {
  const code = `
    import hl from 'babel-plugin-transform-syntax-highlight/highlight';
    const snippet = hl.html({ language: 'javascript' }, \`
      const foo = 'bar';
      const bar = '{# props.bar #}';
    \`);
  `;
  expect(transform(code)).toMatchSnapshot();
});

test('require in nested scope', () => {
  const code = `
    function x() {
      if (true) {
        const h = require('babel-plugin-transform-syntax-highlight/highlight');
        const snippet = h.html({ language: 'javascript' }, \`
          const bar = x => x * {# props.factor #};
        \`);
      }
    }
  `;
  expect(transform(code)).toMatchSnapshot();
});

test('code as string literal', () => {
  const code = `
    const highlight = require('babel-plugin-transform-syntax-highlight/highlight');
    const snippet = highlight.react({ language: 'javascript' }, 'var x = 3;');
  `;
  expect(transform(code)).toMatchSnapshot();
});

test('Babel options', () => {
  const options = {
    langauge: 'javascript',
    packageName: 'highlighter',
    delimiters: ['{{', '}}']
  };
  const code = `
  import hl from 'highlighter';
  const snippet = hl.html(\`
    const foo = {{ props.foo }};
    const bar = '{# props.bar #}';
  \`);
  `;
  expect(transform(code, options)).toMatchSnapshot();
});

test('Local options', () => {
  const code = `
    const h = require('babel-plugin-transform-syntax-highlight/highlight');
    const html = h.html({
      language: 'javascript',
      delimiters: ['[[', ']]']
    }, \`const bar = '[[ props.bar ]]';\`);
    const element = h.react({
      language: 'javascript',
      highlight: 'prism',
      delimiters: ['{{', '}}']
    }, \`const bar = '{{ props.bar }}';\`);
  `;
  expect(transform(code)).toMatchSnapshot();
});
