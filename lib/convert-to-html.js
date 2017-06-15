'use strict';

const getHighlightedHtml = require('./get-highlighted-html');
const placeholdersToHtmlComments = require('./placeholders-to-html-comments');
const transformPlaceholders = require('./transform-placeholders');

module.exports = (options, code) => {
  const html = getHighlightedHtml(options, code);
  const result = placeholdersToHtmlComments(html, options.delimiters);
  const templateLiteral = transformPlaceholders(
    result.html,
    ['<!--', '-->'],
    body => ['${', result.placeholders.get(body), '}'].join('')
  );
  return `function(props) { return \`${templateLiteral}\`; }`;
};
