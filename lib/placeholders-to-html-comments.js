'use strict';

const transformPlaceholders = require('./transform-placeholders');

module.exports = (source, delimiters) => {
  const placeholders = new Map();
  const html = transformPlaceholders(source, delimiters, (body, id) => {
    placeholders.set(id, body);
    return `<!-- ${id} -->`;
  });
  return {
    html,
    placeholders
  };
};
