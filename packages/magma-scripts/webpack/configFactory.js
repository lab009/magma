import Config from 'webpack-chain'
import appRootDir from 'app-root-dir'
import AssetsPlugin from 'assets-webpack-plugin'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import nodeExternals from 'webpack-node-externals'
import path from 'path'
import webpack from 'webpack'
import WebpackMd5Hash from 'webpack-md5-hash'

import happyPackPlugin from '@lab009/magma-utils/happypack'
import config from '@lab009/magma-config'

import output from '../output'
import withServiceWorker from './withServiceWorker'

/**
 * Generates a webpack configuration for the target configuration.
 *
 * This function has been configured to support one "client/web" bundle, and any
 * number of additional "node" bundles (e.g. our "server").  You can define
 * additional node bundles by editing the project confuguration.
 *
 * @param  {Object} options - The build options.
 * @param  {target} options.target - The bundle target (e.g 'clinet' || 'server').
 * @param  {target} options.optimize - Build an optimised version of the bundle?
 *
 * @return {Object} The webpack configuration.
 */
export default function webpackConfigFactory(_options) {
  const { target, optimize = false } = _options

  const isProd = optimize
  const isDev = !isProd
  const isClient = target === 'client'
  const isServer = target === 'server'
  const isNode = !isClient
  const isDevClient = isDev && isClient
  const isProdClient = isProd && isClient

  const buildOptions = {
    ..._options,
    isProd,
    isDev,
    isClient,
    isServer,
    isNode,
    isDevClient,
    isProdClient,
  }

  const webpackConfig = new Config()

  const configFileName = path.resolve(appRootDir.get(), 'config/values')

  output.note(
    `Creating ${isProd ? 'an optimised' : 'a development'} bundle configuration for the "${target}"`
  )

  const bundleConfig = isServer || isClient
    ? // This is either our "server" or "client" bundle.
      config(['bundles', target])
    : // Otherwise it must be an additional node bundle.
      config(['additionalNodeBundles', target])

  if (!bundleConfig) {
    throw new Error('No bundle configuration exists for target:', target)
  }

  webpackConfig
    // Define our entry chunks for our bundle.
    // We name our entry files "index" as it makes it easier for us to
    // import bundle output files (e.g. `import server from './build/server';`)
    .entry('index')
    // Required to support hot reloading of our client.
    .when(isDevClient, use =>
      use.add(
        `${require.resolve('webpack-hot-middleware/client')}?reload=true&path=http://${config('host')}:${config('clientDevServerPort')}/__webpack_hmr`
      )
    )
    // The source entry file for the bundle.
    .add(path.resolve(appRootDir.get(), bundleConfig.srcEntryFile))
    .end()
    // Bundle output configuration.
    .output.path(path.resolve(appRootDir.get(), bundleConfig.outputPath)) // The dir in which our bundle should be output.
    // Add /* filename */ comments to generated require()s in the output.
    .when(isDev, use => use.pathinfo(true))
    // The filename format for our bundle's entries.
    .when(
      isProdClient,
      // For our production client bundles we include a hash in the filename.
      // That way we won't hit any browser caching issues when our bundle
      // output changes.
      // Note: as we are using the WebpackMd5Hash plugin, the hashes will
      // only change when the file contents change. This means we can
      // set very aggressive caching strategies on our bundle output.
      use => use.filename('[name]-[chunkhash].js'),
      // For any other bundle (typically a server/node) bundle we want a
      // determinable output name to allow for easier importing/execution
      // of the bundle by our scripts.
      use => use.filename('[name].js')
    )
    // The name format for any additional chunks produced for the bundle.
    .chunkFilename('[name]-[chunkhash].js')
    // When in node mode we will output our bundle as a commonjs2 module.
    .when(isNode, use => use.libraryTarget('commonjs2'), use => use.libraryTarget('var'))
    // This is the web path under which our webpack bundled client should
    // be considered as being served from.
    .when(
      isDev,
      use =>
        use.publicPath(
          `http://${config('host')}:${config('clientDevServerPort')}${config('bundles.client.webPath')}`
        ),
      use => use.publicPath(bundleConfig.webPath)
    )
    .end()
    .when(
      isClient,
      // Only our client bundle will target the web as a runtime.
      use => use.target('web'),
      // Any other bundle must be targetting node as a runtime.
      use => use.target('node')
    )
    // Ensure that webpack polyfills the following node features for use
    // within any bundles that are targetting node as a runtime. This will be
    // ignored otherwise.
    .node.set('__dirname', true)
    .set('__filename', true)
    .end()
    // Source map settings.
    .when(
      // Include source maps for ANY node bundle so that we can support
      // nice stack traces for errors (the source maps get consumed by
      // the `node-source-map-support` module to allow for this).
      isNode ||
        // Always include source maps for any development build.
        isDev ||
        // Allow for the following flag to force source maps even for production
        // builds.
        config('includeSourceMapsForOptimisedClientBundle'),
      // Produces an external source map (lives next to bundle output files).
      use => use.devtool('source-map'),
      // Produces no source map.
      use => use.devtool('hidden-source-map')
    )
    // Performance budget feature.
    // This enables checking of the output bundle size, which will result in
    // warnings/errors if the bundle sizes are too large.
    // We only want this enabled for our production client.  Please
    // see the webpack docs on how you can configure this to your own needs:
    // https://webpack.js.org/configuration/performance/
    .performance.when(
      isProdClient,
      // Enable webpack's performance hints for production client builds.
      use => use.hints('warning')
    )
    .end()
    .resolve.extensions.merge(
      config('bundleSrcTypes').map(
        // These extensions are tried when resolving a file.
        ext => `.${ext}`
      )
    )
    .end()
    .modules.add('local_modules')
    .add('node_modules')
    .add(appRootDir.get())
    .end()
    .mainFiles.add('.lookup')
    .add('index')
    .end()
    .end()
    // We don't want our node_modules to be bundled with any bundle that is
    // targetting the node environment, prefering them to be resolved via
    // native node module system. Therefore we use the `webpack-node-externals`
    // library to help us generate an externals configuration that will
    // ignore all the node_modules.
    .when(isNode, use =>
      use.externals(
        nodeExternals(
          // Some of our node_modules may contain files that depend on our
          // webpack loaders, e.g. CSS or SASS.
          // For these cases please make sure that the file extensions are
          // registered within the following configuration setting.
          {
            whitelist: [
              // Include all config and component from magma
              /^@lab009\/magma-/,
              // We always want the source-map-support included in
              // our node target bundles.
              'source-map-support/register',
            ]
              // And any items that have been whitelisted in the config need
              // to be included in the bundling process too.
              .concat(config('nodeExternalsFileTypeWhitelist') || []),
          }
        )
      )
    )

  // These are process.env flags that you can use in your code in order to
  // have advanced control over what is included/excluded in your bundles.
  // For example you may only want certain parts of your code to be
  // included/ran under certain conditions.
  //
  // Any process.env.X values that are matched will be code substituted for
  // the associated values below.
  //
  // For example you may have the following in your code:
  //   if (process.env.BUILD_FLAG_IS_CLIENT === 'true') {
  //     console.log('Foo');
  //   }
  //
  // If the BUILD_FLAG_IS_CLIENT was assigned a value of `false` the above
  // code would be converted to the following by the webpack bundling
  // process:
  //   if ('false' === 'true') {
  //     console.log('Foo');
  //   }
  //
  // When your bundle is built using the UglifyJsPlugin unreachable code
  // blocks like in the example above will be removed from the bundle
  // final output. This is helpful for extreme cases where you want to
  // ensure that code is only included/executed on specific targets, or for
  // doing debugging.
  //
  // NOTE: We are stringifying the values to keep them in line with the
  // expected type of a typical process.env member (i.e. string).
  webpackConfig.plugin('env').use(webpack.EnvironmentPlugin, [
    {
      // It is really important to use NODE_ENV=production in order to use
      // optimised versions of some node_modules, such as React.
      NODE_ENV: isProd ? 'production' : 'development',
      // Is this the "client" bundle?
      BUILD_FLAG_IS_CLIENT: JSON.stringify(isClient),
      // Is this the "server" bundle?
      BUILD_FLAG_IS_SERVER: JSON.stringify(isServer),
      // Is this a node bundle?
      BUILD_FLAG_IS_NODE: JSON.stringify(isNode),
      // Is this a development build?
      BUILD_FLAG_IS_DEV: JSON.stringify(isDev),
      // config filename
      MAGMA_CONFIG_VALUES: configFileName,
    },
  ])

  if (isNode) {
    // This grants us source map support, which combined with our webpack
    // source maps will give us nice stack traces for our node executed
    // bundles.
    // We use the BannerPlugin to make sure all of our chunks will get the
    // source maps support installed.
    webpackConfig.plugin('banner').use(webpack.BannerPlugin, [
      {
        banner: 'require("source-map-support/register");',
        raw: true,
        entryOnly: false,
      },
    ])
  }

  if (isClient) {
    // We use this so that our generated [chunkhash]'s are only different if
    // the content for our respective chunks have changed.  This optimises
    // our long term browser caching strategy for our client bundle, avoiding
    // cases where browsers end up having to download all the client chunks
    // even though 1 or 2 may have only changed.
    webpackConfig.plugin('hash').use(WebpackMd5Hash)

    // Generates a JSON file containing a map of all the output files for
    // our webpack bundle.  A necessisty for our server rendering process
    // as we need to interogate these files in order to know what JS/CSS
    // we need to inject into our HTML. We only need to know the assets for
    // our client bundle.
    webpackConfig.plugin('assets').use(AssetsPlugin, [
      {
        filename: config('bundleAssetsFileName'),
        path: path.resolve(appRootDir.get(), bundleConfig.outputPath),
      },
    ])
  }

  if (isDev) {
    // We don't want webpack errors to occur during development as it will
    // kill our dev servers.
    webpackConfig.plugin('error').use(webpack.NoEmitOnErrorsPlugin)
  }

  if (isDevClient) {
    // We need this plugin to enable hot reloading of our client.
    webpackConfig.plugin('hot').use(webpack.HotModuleReplacementPlugin)
  }

  if (isProdClient) {
    // For our production client we need to make sure we pass the required
    // configuration to ensure that the output is minimized/optimized.
    webpackConfig.plugin('options').use(webpack.LoaderOptionsPlugin, [
      {
        minimize: true,
      },
    ])

    // For our production client we need to make sure we pass the required
    // configuration to ensure that the output is minimized/optimized.
    webpackConfig.plugin('uglify').use(webpack.optimize.UglifyJsPlugin, [
      {
        sourceMap: config('includeSourceMapsForOptimisedClientBundle'),
        compress: {
          screw_ie8: true,
          warnings: false,
        },
        mangle: {
          screw_ie8: true,
        },
        output: {
          comments: false,
          screw_ie8: true,
        },
      },
    ])

    // For the production build of the client we need to extract the CSS into
    // CSS files.
    webpackConfig.plugin('extract').use(ExtractTextPlugin, [
      {
        filename: '[name]-[contenthash].css',
        allChunks: true,
      },
    ])
  }

  // -----------------------------------------------------------------------
  // START: HAPPY PACK PLUGINS
  //
  // @see https://github.com/amireh/happypack/
  //
  // HappyPack allows us to use threads to execute our loaders. This means
  // that we can get parallel execution of our loaders, significantly
  // improving build and recompile times.
  //
  // This may not be an issue for you whilst your project is small, but
  // the compile times can be signficant when the project scales. A lengthy
  // compile time can significantly impare your development experience.
  // Therefore we employ HappyPack to do threaded execution of our
  // "heavy-weight" loaders.

  // HappyPack 'javascript' instance.
  webpackConfig
    .plugin('happypack-javascript')
    .init((Plugin, babelConfig) =>
      happyPackPlugin({
        name: 'happypack-javascript',
        loaders: [
          {
            // We will use babel to do all our JS processing.
            path: require.resolve('babel-loader'),
            query: babelConfig,
          },
        ],
      })
    )
    // For our client bundles we transpile all the latest ratified
    // ES201X code into ES5, safe for browsers.  We exclude module
    // transilation as webpack takes care of this for us, doing
    // tree shaking in the process.
    .when(isDevClient, use =>
      use.set('args', [
        require.resolve('@lab009/babel-preset-magma'),
        {
          targets: {
            browsers: 'last 1 chrome version',
          },
          runtime: true,
          optimize: false,
        },
      ])
    )
    .when(isProdClient, use =>
      use.set('args', [
        require.resolve('@lab009/babel-preset-magma'),
        {
          runtime: true,
        },
      ])
    )
    // Also, we have disabled modules transpilation as webpack will
    // take care of that for us ensuring tree shaking takes place.
    // NOTE: Make sure you use the same node version for development
    // and production.
    .when(isNode, use =>
      use.set('args', [
        require.resolve('@lab009/babel-preset-magma'),
        {
          targets: {
            node: 'current',
          },
          runtime: true,
        },
      ])
    )
    // Our "standard" babel config.
    .tap(preset => ({
      // We need to ensure that we do this otherwise the babelrc will
      // get interpretted and for the current configuration this will mean
      // that it will kill our webpack treeshaking feature as the modules
      // transpilation has not been disabled within in.
      babelrc: false,
      presets: [preset],
    }))
    // We will create a babel config and pass it through the plugin
    // defined in the project configuration, allowing additional
    // items to be added.
    .tap(babelConfig => config('plugins.babelConfig')(babelConfig, buildOptions))

  if (isDevClient) {
    // HappyPack 'css' instance for development client.
    webpackConfig
      .plugin('happypack-devclient-css')
      .init((Plugin, args) => happyPackPlugin(args))
      .set('args', {
        name: 'happypack-devclient-css',
        loaders: [
          require.resolve('style-loader'),
          {
            path: require.resolve('css-loader'),
            // Include sourcemaps for dev experience++.
            query: {
              sourceMap: true,
            },
          },
        ],
      })
  }

  // END: HAPPY PACK PLUGINS
  // -----------------------------------------------------------------------

  // JAVASCRIPT
  webpackConfig.module
    .rule('javascript')
    .test(/\.jsx?$/)
    .include.add(/local_modules/)
    .add(/magma-[\w-]+[/\\\\](?!node_modules)/)
    .merge(bundleConfig.srcPaths.map(srcPath => path.resolve(appRootDir.get(), srcPath)))
    .end()
    // We will defer all our js processing to the happypack plugin
    // named "happypack-javascript".
    // See the respective plugin within the plugins section for full
    // details on what loader is being implemented.
    .use('happypack-javascript')
    .loader(`${require.resolve('happypack/loader')}?id=happypack-javascript`)

  // LOOKUP
  webpackConfig.module
    .rule('lookup')
    .test(/\.lookup$/)
    .use('glob')
    .loader(require.resolve('@lab009/glob-loader'))

  // This is bound to our server/client bundles as we only expect to be
  // serving the client bundle as a Single Page Application through the
  // server.
  if (isClient || isServer) {
    // CSS
    webpackConfig.module
      .rule('style')
      .test(/\.css$/)
      // For development clients we will defer all our css processing to the
      // happypack plugin named "happypack-devclient-css".
      // See the respective plugin within the plugins section for full
      // details on what loader is being implemented.
      .when(isDevClient, rule =>
        rule.use('css').loader(`${require.resolve('happypack/loader')}?id=happypack-devclient-css`)
      )
      // For a production client build we use the ExtractTextPlugin which
      // will extract our CSS into CSS files. We don't use happypack here
      // as there are some edge cases where it fails when used within
      // an ExtractTextPlugin instance.
      // Note: The ExtractTextPlugin needs to be registered within the
      // plugins section too.
      .when(isProdClient, rule =>
        ExtractTextPlugin.extract({
          fallback: require.resolve('style-loader'),
          use: [require.resolve('css-loader')],
        }).forEach(({ loader, options }) => rule.use(loader).loader(loader).options(options))
      )
      // When targetting the server we use the "/locals" version of the
      // css loader, as we don't need any css files for the server.
      .when(isNode, rule => rule.use('css').loader(require.resolve('css-loader/locals')))

    // ASSETS (Images/Fonts/etc)
    webpackConfig.module
      .rule('assets')
      .test(new RegExp(`\\.(${config('bundleAssetTypes').join('|')})$`, 'i'))
      .use('file')
      .loader(require.resolve('file-loader'))
      .options({
        // What is the web path that the client bundle will be served from?
        // The same value has to be used for both the client and the
        // server bundles in order to ensure that SSR paths match the
        // paths used on the client.
        publicPath: isDev
          ? // When running in dev mode the client bundle runs on a
            // seperate port so we need to put an absolute path here.
            `http://${config('host')}:${config('clientDevServerPort')}${config('bundles.client.webPath')}`
          : // Otherwise we just use the configured web path for the client.
            config('bundles.client.webPath'),
        // We only emit files when building a web bundle, for the server
        // bundle we only care about the file loader being able to create
        // the correct asset URLs.
        emitFile: isClient,
        name: isDev ? '[name].[ext]' : '[hash].[ext]',
      })
  }

  if (isProd && isClient) {
    withServiceWorker(webpackConfig, bundleConfig)
  }

  // Apply the configuration middleware.
  config('plugins.webpackConfig')(webpackConfig, buildOptions)

  return webpackConfig.toConfig()
}
