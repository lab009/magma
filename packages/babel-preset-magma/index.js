/* eslint semi: ["error", "always"] */
/* eslint comma-dangle: ["error", "never"] */

var path = require('path');

function preset(context, opts) {
  opts = opts || {};
  var runtime = false;
  var targets;
  var loose = false;
  var modules = false;
  var optimize = true;
  var debug = false;

  if (opts !== undefined) {
    if (opts.runtime !== undefined) runtime = opts.runtime;
    if (opts.targets !== undefined) targets = opts.targets;
    if (opts.loose !== undefined) loose = opts.loose;
    if (opts.modules !== undefined) modules = opts.modules;
    if (opts.optimize !== undefined) optimize = opts.optimize;
    if (opts.debug !== undefined) debug = opts.debug;
  }

  var plugins = [
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
        useBuiltIns: true
      }
    ],
    // Transforms JSX
    [
      require.resolve('babel-plugin-transform-react-jsx'),
      {
        useBuiltIns: true
      }
    ]
  ];

  if (runtime === true) {
    // Polyfills the runtime needed for async/await, generators and helpers
    plugins.push.apply(plugins, [
      [
        require.resolve('babel-plugin-transform-runtime'),
        {
          helpers: true,
          polyfill: false,
          regenerator: true,
          // Resolve the Babel runtime relative to the config.
          moduleName: path.dirname(require.resolve('babel-runtime/package'))
        }
      ]
    ]);
  }

  if (!optimize) {
    // The following two plugins are currently necessary to make React warnings
    // include more valuable information.
    plugins.push.apply(plugins, [
      // Adds component stack to warning messages
      require.resolve('babel-plugin-transform-react-jsx-source'),
      // Adds __self attribute to JSX which React will use for some warnings
      require.resolve('babel-plugin-transform-react-jsx-self')
    ]);
  }

  if (optimize) {
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
      [require.resolve('babel-plugin-transform-react-remove-prop-types'), { removeImport: true }]
    ]);
  }

  if (targets && targets.node) {
    // Compiles import() to a deferred require()
    plugins.push.apply(plugins, [require.resolve('babel-plugin-dynamic-import-node')]);
  } else {
    // Enables parsing of import()
    plugins.push.apply(plugins, [require.resolve('babel-plugin-syntax-dynamic-import')]);
  }

  var presets = [
    // Latest stable ECMAScript features
    [
      require.resolve('babel-preset-env'),
      {
        targets,
        loose,
        modules,
        debug,
        useBuiltIns: true
      }
    ],
    // JSX, Flow
    require.resolve('babel-preset-react')
  ];

  return {
    presets,
    plugins
  };
}

module.exports = preset;
