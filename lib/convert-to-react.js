'use strict';

const constants = require('./constants');
const getHighlightedHtml = require('./get-highlighted-html');
const extractPlaceholders = require('./extract-placeholders');
const transformPlaceholders = require('./transform-placeholders');
const HTMLtoJSX = require('htmltojsx');

const toJsx = new HTMLtoJSX({ createClass: false });

module.exports = (options, code, variableName) => {
  const html = getHighlightedHtml(options, code);
  const result = extractPlaceholders(html, options.delimiters);
  const jsx = toJsx.convert(result.html).trim();
  const replacePlaceholders = body =>
    ['{', result.placeholders.get(body), '}'].join('');
  const jsxWithExpressions = transformPlaceholders(
    jsx,
    constants.NUMERIC_DELIMITERS,
    replacePlaceholders
  );
  return `function ${variableName}(props) { return ${jsxWithExpressions}; }`;
};
