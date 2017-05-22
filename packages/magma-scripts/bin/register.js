/* eslint semi: ["error", "always"] */
/* eslint comma-dangle: ["error", "never"] */

require('babel-core/register')({
  presets: [
    [
      require.resolve('@lab009/babel-preset-magma'),
      { targets: { node: 'current' }, modules: 'commonjs' }
    ]
  ],
  only: /(magma-[\w-]+[/\\\\](?!node_modules)|config\/values\.js$)/
});
