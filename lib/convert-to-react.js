'use strict';

const getHighlightedHtml = require('./get-highlighted-html');
const placeholdersToHtmlComments = require('./placeholders-to-html-comments');
const transformPlaceholders = require('./transform-placeholders');
const HTMLtoJSX = require('htmltojsx');

const toJsx = new HTMLtoJSX({ createClass: false });

module.exports = (options, code, variableName) => {
  const html = getHighlightedHtml(options, code);
  const result = placeholdersToHtmlComments(html, options.delimiters);
  const jsx = toJsx.convert(result.html).trim();
  const jsxWithExpressions = transformPlaceholders(jsx, ['{/*', '*/}'], body =>
    ['{', result.placeholders.get(body), '}'].join('')
  );
  return `function ${variableName}(props) { return ${jsxWithExpressions}; }`;
};
