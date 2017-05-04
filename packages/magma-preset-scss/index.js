import happyPackPlugin from '@lab009/magma-utils/happypack'

export default scssOptions => (webpackConfig, buildOptions) => {
  const { isClient, isServer, isDevClient, isProdClient, isNode } = buildOptions

  if (isDevClient) {
    // HappyPack 'scss' instance for development client.
    webpackConfig.plugin('happypack-devclient-scss').init((Plugin, args) => happyPackPlugin(args)).set('args', {
      name: 'happypack-devclient-scss',
      loaders: [
        require.resolve('style-loader'),
        {
          path: require.resolve('css-loader'),
          // Include sourcemaps for dev experience++.
          query: {
            sourceMap: true,
            importLoaders: 1,
          },
        },
        {
          path: require.resolve('sass-loader'),
          query: {
            sourceMap: true,
            ...scssOptions,
          },
        },
      ],
    })
  }

  // This is bound to our server/client bundles as we only expect to be
  // serving the client bundle as a Single Page Application through the
  // server.
  if (isClient || isServer) {
    // SCSS
    webpackConfig.module
      .rule('scss')
      .test(/\.scss$/)
      // For development clients we will defer all our scss processing to the
      // happypack plugin named "happypack-devclient-scss".
      // See the respective plugin within the plugins section for full
      // details on what loader is being implemented.
      .when(isDevClient, rule => rule.use('scss').loader(`${require.resolve('happypack/loader')}?id=happypack-devclient-scss`))
      // For a production client build we use the ExtractTextPlugin which
      // will extract our CSS into CSS files. We don't use happypack here
      // as there are some edge cases where it fails when used within
      // an ExtractTextPlugin instance.
      // Note: The ExtractTextPlugin needs to be registered within the
      // plugins section too.
      .when(isProdClient, rule =>
        webpackConfig
          .plugin('extract')
          .get('plugin')
          .extract({
            fallback: require.resolve('style-loader'),
            use: [
              {
                loader: require.resolve('css-loader'),
                options: {
                  importLoaders: 1,
                },
              },
              {
                loader: require.resolve('sass-loader'),
                options: scssOptions,
              },
            ],
          })
          .forEach(({ loader, options }) => rule.use(loader).loader(loader).options(options)),
      )
      // When targetting the server we use the "/locals" version of the
      // css loader, as we don't need any scss files for the server.
      .when(isNode, rule =>
        rule
          .use('css')
          .loader(require.resolve('css-loader/locals'))
          .options({ importLoaders: 1 })
          .end()
          .use('scss')
          .loader(require.resolve('sass-loader'))
          .options(scssOptions),
      )
  }
}
