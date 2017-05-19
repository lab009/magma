module.exports = {
  root: true,

  parser: require.resolve('babel-eslint'),

  plugins: ['flowtype'],

  env: {
    browser: true,
    commonjs: true,
    es6: true,
    jest: true,
    node: true,
  },

  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
      generators: true,
      experimentalObjectRestSpread: true,
    },
  },

  extends: require.resolve('eslint-config-airbnb'),

  rules: {
    // http://eslint.org/docs/rules/
    'no-param-reassign': 'warn',
    camelcase: 'off',
    'consistent-return': 'warn',
    'global-require': 'warn',
    'no-underscore-dangle': 'off',
    'no-use-before-define': ['warn', 'nofunc'],
    semi: ['error', 'never'],
    // Node currently does not support trailing function commas
    'comma-dangle': [
      'error',
      {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'never',
      },
    ],

    // https://github.com/yannickcr/eslint-plugin-react/tree/master/docs/rules
    'react/forbid-prop-types': 'off',
    'react/jsx-filename-extension': ['error', { extensions: ['.js', '.jsx'] }],

    // https://github.com/gajus/eslint-plugin-flowtype
    'flowtype/define-flow-type': 'warn',
    'flowtype/require-valid-file-annotation': 'warn',
    'flowtype/use-flow-type': 'warn',
  },
}
