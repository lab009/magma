import { resolve as pathResolve } from 'path'
import webpack from 'webpack'
import appRootDir from 'app-root-dir'
import config from '@lab009/magma-config'

import output from '../output'
import HotNodeServer from './hotNodeServer'
import HotClientServer from './hotClientServer'
import createVendorDLL from './createVendorDLL'
import webpackConfigFactory from '../webpack/configFactory'

const usesDevVendorDLL = bundleConfig =>
  bundleConfig.devVendorDLL != null && bundleConfig.devVendorDLL.enabled

const vendorDLLsFailed = (err) => {
  output.log({
    level: 'error',
    title: 'vendorDLL',
    message: 'Unfortunately an error occured whilst trying to build the vendor dll(s) used by the development server. Please check the console for more information.',
    notify: true,
  })
  if (err) {
    output.error(err)
  }
}

const initializeBundle = (name, bundleConfig) => {
  const createCompiler = () => {
    try {
      const webpackConfig = webpackConfigFactory({
        target: name,
        mode: 'development',
      })
      // Install the vendor DLL config for the client bundle if required.
      if (name === 'client' && usesDevVendorDLL(bundleConfig)) {
        // Install the vendor DLL plugin.
        webpackConfig.plugins.push(
          new webpack.DllReferencePlugin({
            manifest: require(pathResolve(
              appRootDir.get(),
              bundleConfig.outputPath,
              `${bundleConfig.devVendorDLL.name}.json`
            )),
          })
        )
      }
      return webpack(webpackConfig)
    } catch (err) {
      output.log({
        level: 'error',
        message: 'Webpack config is invalid, please check the console for more information.',
        notify: true,
      })
      output.error(err)
      throw err
    }
  }

  return { name, bundleConfig, createCompiler }
}

class HotDevelopment {
  constructor() {
    this.hotClientServer = null
    this.hotNodeServers = []

    const clientBundle = initializeBundle('client', config('bundles.client'))

    const nodeBundles = [
      initializeBundle('server', config('bundles.server')),
    ].concat(
      Object.keys(config('additionalNodeBundles')).map(name =>
        initializeBundle(name, config('additionalNodeBundles')[name])
      )
    )

    Promise
      // First ensure the client dev vendor DLLs is created if needed.
      .resolve(
        usesDevVendorDLL(config('bundles.client'))
          ? createVendorDLL('client', config('bundles.client'))
          : true
      )
      // Then start the client development server.
      .then(
        () =>
          new Promise((resolve) => {
            const { createCompiler } = clientBundle
            const compiler = createCompiler()
            compiler.plugin('done', (stats) => {
              if (!stats.hasErrors()) {
                resolve(compiler)
              }
            })
            this.hotClientServer = new HotClientServer(compiler)
          }),
        vendorDLLsFailed
      )
      // Then start the node development server(s).
      .then((clientCompiler) => {
        this.hotNodeServers = nodeBundles.map(
          ({ name, createCompiler }) =>
            new HotNodeServer(name, createCompiler(), clientCompiler)
        )
      })
  }

  dispose() {
    const safeDisposer = server =>
      server ? server.dispose() : Promise.resolve()

    // First the hot client server.
    return (
      safeDisposer(this.hotClientServer)
        // Then dispose the hot node server(s).
        .then(() => Promise.all(this.hotNodeServers.map(safeDisposer)))
    )
  }
}

export default HotDevelopment
