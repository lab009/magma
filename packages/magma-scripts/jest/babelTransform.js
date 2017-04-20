/* eslint semi: ["error", "always"] */
/* eslint comma-dangle: ["error", "never"] */

const babelJest = require('babel-jest');

module.exports = babelJest.createTransformer({
  presets: [[require.resolve('@lab009/babel-preset-magma'), { targets: { node: 'current' }, modules: 'commonjs', optimize: false }]],
  babelrc: false
});
