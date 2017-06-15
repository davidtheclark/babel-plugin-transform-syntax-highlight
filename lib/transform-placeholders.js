'use strict';

const balancedMatch = require('balanced-match');

module.exports = (string, delimiters, transform) => {
  if (delimiters.length !== 2 && delimiters.every(x => typeof x === 'string')) {
    throw new Error('Delimeters must be a two-string array');
  }

  const transformNextPlaceholder = str => {
    const match = balancedMatch(delimiters[0], delimiters[1], str);
    if (!match) return str;
    const interpolation = str.slice(
      match.start,
      match.end + delimiters[1].length
    );
    const transformed = transform(match.body.trim(), String(match.start));
    if (transformed === false) return str;
    const nextStr = [
      match.pre,
      transformed,
      match.post
    ].join('');
    return transformNextPlaceholder(nextStr);
  };

  return transformNextPlaceholder(string);
};
