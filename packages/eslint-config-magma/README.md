# @lab009/eslint-config-magma

The ESLint configuration for Magma applications.

## Usage

Our default export contains all of our ESLint rules, including EcmaScript 6+
and React. It requires `eslint`, `eslint-plugin-react`, `eslint-plugin-jsx-a11y`, and `eslint-plugin-import`.

1. Install the correct versions of each package, which are listed by the command:

  ```sh
  npm info "@lab009/eslint-config-magma@latest" peerDependencies
  ```

  Use the [install-peerdeps](https://github.com/nathanhleung/install-peerdeps) cli tool.

  ```sh
  npm install -g install-peerdeps
  install-peerdeps --dev @lab009/eslint-config-magma
  ```

  The cli will produce and run a command like:

  ```sh
  npm install --save-dev @lab009/eslint-config-magma eslint@^#.#.# eslint-plugin-jsx-a11y@^#.#.# eslint-plugin-import@^#.#.# eslint-plugin-react@^#.#.#
  ```

2. add `"extends": "@lab009/eslint-config-magma"` to your .eslintrc
