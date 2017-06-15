'use strict';

const HighlightJs = require('highlight.js');
const Prism = require('prismjs');

const highlightPrism = (code, lang) => {
  const fallback = `<pre><code>${code}</pre></code>`;
  if (!lang) return fallback;
  // lang must be http://prismjs.com/#languages-list
  const grammar = Prism.languages[lang];
  if (!grammar) return fallback;
  const highlightedCode = Prism.highlight(code, grammar);
  // Needs the wrapper class
  return `<pre><code class="language-${lang}">${highlightedCode}</code></pre>`;
};

const highlightHighlightJs = (code, lang) => {
  let highlightedCode = '';
  if (lang !== null && HighlightJs.getLanguage(lang)) {
    try {
      highlightedCode = HighlightJs.highlight(lang, code).value
    } catch (error) {
      console.error(error)
    }
  } else {
    try {
      highlightedCode = HighlightJs.highlightAuto(code).value
    } catch (error) {
      console.error(error)
    }
  }
  return `<pre><code class="hljs">${highlightedCode}</code></pre>`;
};

module.exports = (options, code) => {
  let highlight;
  if (options.highlight === 'prism') {
    highlight = highlightPrism;
  } else if (options.highlight === 'highlightjs') {
    highlight = highlightHighlightJs;
  } else if (typeof options.highlight === 'function') {
    highlight = options.highlight;
  } else {
    throw new Error('Invalid value for "highlight" option');
  }

  return highlight(code, options.language);
};
