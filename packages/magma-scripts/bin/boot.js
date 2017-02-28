require('@lab009/babel-preset-magma');

require('babel-core/register')({
  'presets': [
    [require.resolve('@lab009/babel-preset-magma'), { 'targets': { 'node': 'current' }, 'modules': 'commonjs' }],
  ]
});

var script = process.argv[2];
require('../scripts/' + script);
