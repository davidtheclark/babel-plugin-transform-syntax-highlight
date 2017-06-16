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

test('highlighting numeric values', () => {
  const code = `
    const highlight = require('babel-plugin-transform-syntax-highlight/highlight');
    const snippet = highlight.html({ language: 'javascript' }, \`
      const foo = '{# props.foo #}';
      const bar = {# props.bar #};
    \`);
  `;
  expect(transform(code)).toMatchSnapshot();
});

test('highlight.js automatic language detection', () => {
  const code = `
    const highlight = require('babel-plugin-transform-syntax-highlight/highlight');
    const snippet = highlight.html(\`
      const foo = () => '{# props.foo #}';
    \`);
  `;
  expect(transform(code)).toMatchSnapshot();
});

test('fails with an invalid option key', () => {
  const code = `
    const highlight = require('babel-plugin-transform-syntax-highlight/highlight');
    const snippet = highlight.html({ lasnguage: 'javascript' }, \`
      const foo = '{# props.foo #}';
      const bar = {# props.bar #};
    \`);
  `;
  let error;
  try {
    transform(code);
  } catch (e) {
    error = e;
  }
  expect(error.message).toContain('Invalid option "lasnguage"');
});

test('fails with an invalid option value', () => {
  const code = `
    const highlight = require('babel-plugin-transform-syntax-highlight/highlight');
    const snippet = highlight.html({ language: 6 }, \`
      const foo = '{# props.foo #}';
      const bar = {# props.bar #};
    \`);
  `;
  let error;
  try {
    transform(code);
  } catch (e) {
    error = e;
  }
  expect(error.message).toContain('Invalid option value for "language"');
});

test('fails with a non-declarator require call', () => {
  const code = `
    let highlight;
    highlight = require('babel-plugin-transform-syntax-highlight/highlight');
  `;
  let error;
  try {
    transform(code);
  } catch (e) {
    error = e;
  }
  expect(error.message).toContain('to a new variable');
});

test('fails with a non-default import', () => {
  const code = `
    import { highlight } from 'babel-plugin-transform-syntax-highlight/highlight';
  `;
  let error;
  try {
    transform(code);
  } catch (e) {
    error = e;
  }
  expect(error.message).toContain('Use a default import');
});

test('fails with placeholders in the template literal', () => {
  const code = `
    const highlight = require('babel-plugin-transform-syntax-highlight/highlight');
    const snippet = highlight.html({ language: 'javascript' }, \`
      const \${x} = '{# props.foo #}';
    \`);
  `;
  let error;
  try {
    transform(code);
  } catch (e) {
    error = e;
  }
  expect(error.message).toContain(
    'Placeholders inside template literal code are not supported'
  );
});

test('fails when module is not in scope', () => {
  const code = `
    function x() {
      const highlight = require('babel-plugin-transform-syntax-highlight/highlight');
    }
    const snippet = highlight.html({ language: 'javascript' }, \`
      const foo = '{# props.foo #}';
    \`);
  `;
  let error;
  try {
    transform(code);
  } catch (e) {
    error = e;
  }
  expect(error.message).toContain('not in scope');
});

test('fails with methods other than "html" and "react"', () => {
  const code = `
    const highlight = require('babel-plugin-transform-syntax-highlight/highlight');
    const snippet = highlight.jsx({ language: 'javascript' }, \`
      const foo = '{# props.foo #}';
    \`);
  `;
  let error;
  try {
    transform(code);
  } catch (e) {
    error = e;
  }
  expect(error.message).toContain('module exposes "html" and "react"');
});

test('fails without variable assignment', () => {
  const code = `
    const highlight = require('babel-plugin-transform-syntax-highlight/highlight');
    const x = {
      foo: highlight.html({ language: 'javascript' }, \`
        const foo = '{# props.foo #}';
      \`)
    };
  `;
  let error;
  try {
    transform(code);
  } catch (e) {
    error = e;
  }
  expect(error.message).toContain('must be assigned to a new variable');
});

test('fails when code is not a string or template literal', () => {
  const code = `
    const highlight = require('babel-plugin-transform-syntax-highlight/highlight');
    const snippet = highlight.html({ language: 'javascript' }, { x: 3 });
  `;
  let error;
  try {
    transform(code);
  } catch (e) {
    error = e;
  }
  expect(error.message).toContain(
    'Code argument must be a string or template literal'
  );
});

test('fails on invalid highlight option', () => {
  const code = `
    const highlight = require('babel-plugin-transform-syntax-highlight/highlight');
    const snippet = highlight.html({ language: 'javascript' }, 'var x = 3;');
  `;
  let error;
  try {
    transform(code, { highlight: 'pism' });
  } catch (e) {
    error = e;
  }
  expect(error.message).toContain('Invalid value for "highlight" option');
});
