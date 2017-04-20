/* eslint semi: ["error", "always"] */
/* eslint comma-dangle: ["error", "never"] */
/* eslint-disable quote-props */

module.exports = {
  parser: require.resolve('babel-eslint'),
  parserOptions: {
    ecmaFeatures: {
      generators: true
    }
  },

  env: {
    browser: true,
    es6: true,
    node: true,
    jest: true
  },

  extends: require.resolve('eslint-config-airbnb'),

  rules: {
    'no-param-reassign': 'warn',
    camelcase: 'off',
    'consistent-return': 'warn',
    'global-require': 'warn',
    'max-len': [
      'error',
      140,
      2,
      {
        ignoreUrls: true,
        ignoreComments: false,
        ignoreRegExpLiterals: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true
      }
    ],
    'no-underscore-dangle': 'off',
    'no-use-before-define': 'warn',
    semi: ['error', 'never'],
    'valid-jsdoc': 'error',
    'react/jsx-filename-extension': ['error', { extensions: ['.js', '.jsx'] }]
  }
};
