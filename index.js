'use strict';

const _ = require('lodash');
const stripIndent = require('strip-indent');
const babylon = require('babylon');
const convertToHtml = require('./lib/convert-to-html');
const convertToReact = require('./lib/convert-to-react');

const validInvocationOptions = new Set([
  'language',
  'highlight',
  'delimiters',
  'numericDelimiters'
]);
const DEFAULT_PACKAGE_NAME =
  'babel-plugin-transform-syntax-highlight/highlight';

module.exports = babel => {
  const bindingsByFile = new Map();
  const t = babel.types;

  const parseOptions = path => {
    if (!t.isObjectExpression(path)) {
      throw path.buildCodeFrameError('An options object is required');
    }
    const properties = path.node.properties;
    const options = {};
    properties.forEach((p, i) => {
      const key = p.key.name;
      if (!validInvocationOptions.has(key)) {
        throw path
          .get(`properties.${i}.key`)
          .buildCodeFrameError(`Invalid option "${key}"`);
      }
      let value;
      if (
        key === 'delimiters' &&
        t.isArrayExpression(p.value) &&
        p.value.elements.length === 2 &&
        p.value.elements.every(t.isStringLiteral)
      ) {
        value = p.value.elements.map(el => el.value);
      } else if (key !== 'delimiters' && t.isStringLiteral(p.value)) {
        value = p.value.value;
      } else {
        throw path
          .get(`properties.${i}.value`)
          .buildCodeFrameError(`Invalid option value for "${key}"`);
      }
      options[key] = value;
    });
    return options;
  };

  const requireVisitor = (path, state) => {
    const arg = path.node.arguments[0];
    const packageName = state.opts.packageName || DEFAULT_PACKAGE_NAME;
    if (!t.isStringLiteral(arg) || arg.value !== packageName) return;

    const parentNode = path.parent;
    if (!t.isVariableDeclarator(parentNode)) {
      throw path.buildCodeFrameError(
        'You must assign babel-plugin-transform-syntax-highlight/highlight to a new variable'
      );
    }

    const bindingName = parentNode.id.name;
    const file = path.hub.file;
    const fileBindings = bindingsByFile.get(file) || new Set();
    bindingsByFile.set(file, fileBindings.add(bindingName));
    path.parentPath.remove();
  };

  const importDeclarationVisitor = (path, state) => {
    const packageName = state.opts.packageName || DEFAULT_PACKAGE_NAME;
    if (
      !t.isLiteral(path.node.source) ||
      path.node.source.value !== packageName
    )
      return;
    const firstSpecifierPath = path.get('specifiers.0');
    if (!t.isImportDefaultSpecifier(firstSpecifierPath)) {
      throw firstSpecifierPath.buildCodeFrameError(
        `Use a default import from "${packageName}"`
      );
    }
    const bindingName = firstSpecifierPath.node.local.name;
    const file = path.hub.file;
    const fileBindings = bindingsByFile.get(file) || new Set();
    bindingsByFile.set(file, fileBindings.add(bindingName));
    path.remove();
  };

  const getStringyLiteralValue = path => {
    if (t.isStringLiteral(path)) {
      return path.node.value;
    }

    if (path.node.expressions.length) {
      throw path.buildCodeFrameError(
        'Placeholders inside template literal code are not supported'
      );
    }
    return path.node.quasis.map(q => q.value.cooked).join('');
  };

  const callExpressionVisitor = (path, state) => {
    const callee = path.get('callee').node;
    if (t.isIdentifier(callee, { name: 'require' })) {
      return requireVisitor(path, state);
    }
    if (!t.isMemberExpression(callee)) return;
    const objectName = callee.object.name;
    const propertyName = callee.property.name;

    // Ensure a module binding is in scope.
    const file = path.hub.file;
    const fileBindings = bindingsByFile.get(file);
    if (!fileBindings || !fileBindings.has(objectName)) return;

    if (!path.scope.hasBinding(objectName)) {
      throw path.buildCodeFrameError(`Module "${objectName}" is not in scope`);
    }
    if (propertyName !== 'html' && propertyName !== 'react') {
      throw path
        .get('callee.property')
        .buildCodeFrameError(
          `The "${objectName}" module exposes "html" and "react" functions. Not "${propertyName}"`
        );
    }

    if (!t.isVariableDeclarator(path.parent)) {
      throw path.buildCodeFrameError(
        `The return value of "${objectName}.${propertyName}()" must be assigned to a new variable`
      );
    }
    const variableName = path.parent.id.name;

    const firstArgument = path.get('arguments.0');
    let argumentOptions;
    let codePath;
    if (t.isObjectExpression(firstArgument)) {
      argumentOptions = parseOptions(firstArgument);
      codePath = path.get('arguments.1');
    } else {
      codePath = path.get('arguments.0');
    }

    if (!t.isTemplateLiteral(codePath) && !t.isStringLiteral(codePath)) {
      throw codePath.buildCodeFrameError(
        'Code argument must be a string or template literal'
      );
    }

    const optionsFromBabelConfig = _.pick(
      state.opts,
      Array.from(validInvocationOptions)
    );
    if (optionsFromBabelConfig.highlight === undefined) {
      optionsFromBabelConfig.highlight = 'highlightjs';
    }
    if (optionsFromBabelConfig.delimiters === undefined) {
      optionsFromBabelConfig.delimiters = ['{#', '#}'];
      optionsFromBabelConfig.numericDelimiters = ['{##', '##}'];
    }
    const options = Object.assign({}, optionsFromBabelConfig, argumentOptions);
    const rawCode = getStringyLiteralValue(codePath);
    const code = stripIndent(rawCode).trim();
    const replacementExpression = propertyName === 'html'
      ? convertToHtml(options, code)
      : convertToReact(options, code, variableName);

    const parsedReplacementExpression = babylon.parseExpression(
      replacementExpression,
      { plugins: ['jsx'] }
    );
    path.replaceWith(parsedReplacementExpression);
  };

  return {
    visitor: {
      CallExpression: callExpressionVisitor,
      ImportDeclaration: importDeclarationVisitor
    }
  };
};
