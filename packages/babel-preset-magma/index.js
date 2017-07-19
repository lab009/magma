/* eslint semi: ["error", "always"] */

const path = require('path');

function objectWithoutProperties(obj, keys) {
  const target = {};
  for (const i in obj) {
    if (keys.indexOf(i) >= 0) continue;
    if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
    target[i] = obj[i];
  }
  return target;
}

function preset(context, opts) {
  const defaultOpts = {
    runtime: false,
    loose: false,
    modules: false,
    optimize: true,
    useBuiltIns: true,
  };

  opts = Object.assign({}, defaultOpts, opts);
  const envOpts = objectWithoutProperties(opts, ['runtime', 'optimize']);
  let envPreset;

  const plugins = [
    // export * as ns from 'mod'
    require.resolve('babel-plugin-transform-export-extensions'),
    // class { handleClick = () => { } }
    require.resolve('babel-plugin-transform-class-properties'),
    // The following two plugins use Object.assign directly, instead of Babel's
    // extends helper. Note that this assumes `Object.assign` is available.
    // { ...todo, completed: true }
    [
      require.resolve('babel-plugin-transform-object-rest-spread'),
      {
        useBuiltIns: true,
      },
    ],
    // Transforms JSX
    [
      require.resolve('babel-plugin-transform-react-jsx'),
      {
        useBuiltIns: true,
      },
    ],
  ];

  if (opts.runtime === true) {
    // Polyfills the runtime needed for async/await, generators and helpers
    plugins.push.apply(plugins, [
      [
        require.resolve('babel-plugin-transform-runtime'),
        {
          helpers: true,
          polyfill: false,
          regenerator: true,
          // Resolve the Babel runtime relative to the config.
          moduleName: path.dirname(require.resolve('babel-runtime/package')),
        },
      ],
    ]);
  }

  if (!opts.optimize) {
    // The following two plugins are currently necessary to make React warnings
    // include more valuable information.
    plugins.push.apply(plugins, [
      // Adds component stack to warning messages
      require.resolve('babel-plugin-transform-react-jsx-source'),
      // Adds __self attribute to JSX which React will use for some warnings
      require.resolve('babel-plugin-transform-react-jsx-self'),
    ]);
  }

  if (opts.optimize) {
    // Optimization: hoist JSX that never changes out of render()
    // Disabled because of issues:
    // * https://phabricator.babeljs.io/search/query/pCNlnC2xzwzx/
    // * https://github.com/babel/babel/issues/4516
    // TODO: Enable again when these issues are resolved.
    // plugins.push.apply(plugins, [
    //   require.resolve('babel-plugin-transform-react-constant-elements')
    // ]);
    // Remove unnecessary React propTypes from the production build
    plugins.push.apply(plugins, [
      [require.resolve('babel-plugin-transform-react-remove-prop-types'), { removeImport: true }],
    ]);
  }

  if (envOpts.targets !== undefined && envOpts.targets.node !== undefined) {
    envPreset = require('babel-preset-env').default;
    // Compiles import() to a deferred require()
    plugins.push.apply(plugins, [require.resolve('babel-plugin-dynamic-import-node')]);
  } else {
    envPreset = require.resolve('babel-preset-env');
    // Enables parsing of import()
    plugins.push.apply(plugins, [require.resolve('babel-plugin-syntax-dynamic-import')]);
  }

  const presets = [
    // Latest stable ECMAScript features
    [envPreset, envOpts],
    // JSX, Flow
    require.resolve('babel-preset-react'),
  ];

  return {
    presets,
    plugins,
  };
}

module.exports = preset;
