/* eslint semi: ["error", "always"] */
/* eslint comma-dangle: ["error", "never"] */

require('@lab009/babel-preset-magma');

require('babel-core/register')({
  presets: [[require.resolve('@lab009/babel-preset-magma'), { targets: { node: 'current' }, modules: 'commonjs' }]],
  only: /(@lab009\/magma-|config\/values\.js$)/
});
