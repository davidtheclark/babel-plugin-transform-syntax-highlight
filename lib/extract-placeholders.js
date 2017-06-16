'use strict';

const constants = require('./constants');
const transformPlaceholders = require('./transform-placeholders');

module.exports = (source, delimiters) => {
  const placeholders = new Map();
  const html = transformPlaceholders(source, delimiters, (body, id) => {
    placeholders.set(id, body);
    return [
      constants.NUMERIC_DELIMITERS[0],
      id,
      constants.NUMERIC_DELIMITERS[1]
    ].join('');
  });
  return {
    html,
    placeholders
  };
};
