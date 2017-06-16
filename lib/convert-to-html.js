'use strict';

const constants = require('./constants');
const getHighlightedHtml = require('./get-highlighted-html');
const extractPlaceholders = require('./extract-placeholders');
const transformPlaceholders = require('./transform-placeholders');

module.exports = (options, code) => {
  const extracted = extractPlaceholders(code, options.delimiters);
  const html = getHighlightedHtml(options, extracted.html);
  const replacePlaceholders = body =>
    ['${', extracted.placeholders.get(body), '}'].join('');
  const templateLiteral = transformPlaceholders(
    html,
    constants.NUMERIC_DELIMITERS,
    replacePlaceholders
  );
  return `function(props) { return \`${templateLiteral}\`; }`;
};
