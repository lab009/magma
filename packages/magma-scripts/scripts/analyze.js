/**
 * This script creates a webpack stats file on our production build of the
 * client bundle and then launches the webpack-bundle-analyzer tool allowing
 * you to easily see what is being included within your bundle.
 *
 * @see https://github.com/th0r/webpack-bundle-analyzer
 */

import webpack from 'webpack'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import yargs from 'yargs'

import webpackConfigFactory from '../webpack/configFactory'
import output from '../output'

const argv = yargs
  .option('client', {
    describe: 'client bundle analyze',
    type: 'boolean',
  })
  .option('server', {
    describe: 'server bundle analyze',
    type: 'boolean',
  })
  .help('h')
  .alias('h', 'help')
  .strict()
  .argv

let target

if (argv.client) target = 'client'
else if (argv.server) target = 'server'
else throw new Error('Please specify --server OR --client as target')

const webpackConfig = webpackConfigFactory({ target, optimize: true })
webpackConfig.plugins.push(
  new BundleAnalyzerPlugin({
    generateStatsFile: true,
    statsFilename: '__analyze__.json',
  }),
)

const clientCompiler = webpack(webpackConfig)

clientCompiler.run((err, stats) => {
  if (err) {
    output.log({
      level: 'error',
      title: 'client',
      message: 'Build failed, please check the console for more information.',
    })
    output.error(err)
    process.exit(1)
  }
})
