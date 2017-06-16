'use strict';

const balancedMatch = require('balanced-match');

module.exports = (string, delimiters, transform) => {
  const transformNextPlaceholder = str => {
    const match = balancedMatch(delimiters[0], delimiters[1], str);
    if (!match) return str;

    const transformed = transform(match.body.trim(), String(match.start));
    if (transformed === false) return str;
    const nextStr = [match.pre, transformed, match.post].join('');
    return transformNextPlaceholder(nextStr);
  };

  return transformNextPlaceholder(string);
};
