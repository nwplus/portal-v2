const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise production modules without initializing Firebase or adding a test dependency.
function load(file, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(resolve(file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  // Same realm as the test runner, so object literals deep-equal in node:assert.
  const run = vm.runInThisContext(`(function (exports, require, console) {${code}\n})`, { filename: file });
  run(exports, (name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  }, console);
  return exports;
}

module.exports = { load };
