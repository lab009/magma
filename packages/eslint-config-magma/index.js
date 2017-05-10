module.exports = {
  parser: require.resolve('babel-eslint'),

  ecmaFeatures: {
    defaultParams: true,
    generators: true,
  },

  env: {
    browser: true,
    es6: true,
    node: true,
    jest: true,
  },

  extends: require.resolve('eslint-config-airbnb'),

  rules: {
    'no-param-reassign': 'warn',
    camelcase: 'off',
    'consistent-return': 'warn',
    'global-require': 'warn',
    'no-underscore-dangle': 'off',
    'no-use-before-define': 'warn',
    semi: ['error', 'never'],
    'valid-jsdoc': 'warn',
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

    'react/forbid-prop-types': 'off',
    'react/jsx-filename-extension': ['error', { extensions: ['.js', '.jsx'] }],
  },
}
