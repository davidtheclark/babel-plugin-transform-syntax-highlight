'use strict';

const _ = require('lodash');
const stripIndent = require('strip-indent');
const prettier = require('prettier');
const babylon = require('babylon');
const convertToHtml = require('./lib/convert-to-html');
const convertToReact = require('./lib/convert-to-react');

const validInvocationOptions = new Set(['language', 'highlight', 'delimiters']);
const DEFAULT_PACKAGE_NAME =
  'babel-plugin-transform-syntax-highlight/highlight';
let moduleVariableName;

const moduleBindings = new Map();

module.exports = babel => {
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
      const value = p.value.value;
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

    const binding = path.scope.bindings[parentNode.id.name];
    moduleBindings.set(parentNode.id.name, binding);
    path.remove();
  };

  const importDeclarationVisitor = (path, state) => {
    const packageName = state.opts.packageName || DEFAULT_PACKAGE_NAME;
    if (!t.isLiteral(path.node.source, { value: packageName })) return;
    const firstSpecifierPath = path.get('specifiers.0');
    if (!t.isImportDefaultSpecifier(firstSpecifierPath)) {
      throw firstSpecifierPath.buildCodeFrameError(
        `Use a default import from "${packageName}"`
      );
    }
    moduleVariableName = firstSpecifierPath.node.local.name;
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

  const isModuleBindingInScope = (moduleName, scope) => {
    if (scope.bindings[moduleName]) return true;
    if (scope.parent) return isModuleBindingInScope(moduleName, scope.parent);
    return false;
  };

  const callExpressionVisitor = (path, state) => {
    const callee = path.get('callee').node;
    if (t.isIdentifier(callee, { name: 'require' })) {
      return requireVisitor(path, state);
    }
    if (moduleBindings.size === 0) return;
    if (!t.isMemberExpression(callee)) return;
    const objectName = callee.object.name;
    const propertyName = callee.property.name;

    // Ensure a module binding is in scope.
    if (!moduleBindings.has(objectName)) return;
    if (isModuleBindingInScope(moduleBindings.get(objectName), path.scope)) {
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
      codePath = path.get('arguments.2');
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
    }
    const options = Object.assign({}, optionsFromBabelConfig, argumentOptions);
    const rawCode = getStringyLiteralValue(codePath);
    const code = stripIndent(rawCode).trim();
    const replacementExpression = propertyName === 'html'
      ? convertToHtml(options, code)
      : convertToReact(options, code, variableName);
    console.log(replacementExpression);
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
