require('@lab009/babel-preset-magma');

require('babel-core/register')({
  "presets": [
    [require.resolve('@lab009/babel-preset-magma'), { "targets": { "node": "current" }, "modules": "commonjs" }],
  ]
});

const path = require('path');
const modAlias = require('module-alias');
modAlias.addAlias('$config', path.resolve(__dirname, '../config'));

const appRootDir = require('app-root-dir');
const modPath = require('app-module-path');
modPath.addPath(appRootDir.get());
