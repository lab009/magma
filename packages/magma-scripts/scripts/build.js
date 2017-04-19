/**
 * This script builds a production output of all of our bundles.
 */

import fs from 'fs-extra'
import { resolve as pathResolve } from 'path'
import webpack from 'webpack'
import appRootDir from 'app-root-dir'
import yargs from 'yargs'
import config from '@lab009/magma-config'

import webpackConfigFactory from '../webpack/configFactory'
import output from '../output'

const argv = yargs
  .option('optimize', {
    describe: 'creating an optimised bundle',
    type: 'boolean',
  })
  .help('h')
  .alias('h', 'help')
  .strict().argv

// Print out errors
function printErrors(level, errors) {
  output.log({
    level,
    title: 'Failed to compile',
    message: 'Build failed, please check the console for more information.',
    notify: true,
  })

  errors.forEach(error => output.printError(level, error))
}

// First clear the build output dir.
fs.emptyDirSync(pathResolve(appRootDir.get(), config('buildOutputPath')))

// Get our "fixed" bundle names
Object.keys(config('bundles'))
  // And the "additional" bundle names
  .concat(Object.keys(config('additionalNodeBundles')))
  // And then build them all.
  .forEach((bundleName) => {
    webpack(webpackConfigFactory({ target: bundleName, optimize: argv.optimize })).run((error, stats) => {
      if (error) {
        printErrors('error', [error])
        process.exit(1)
      }

      if (stats.hasErrors()) {
        printErrors('error', stats.compilation.errors)
        process.exit(1)
      }

      if (process.env.CI && stats.hasWarnings()) {
        printErrors('warning', stats.compilation.warnings)
        process.exit(1)
      }

      output.log({
        level: 'success',
        title: 'Compiled successfully',
        message: `Bundle name: "${bundleName}"`,
      })
    })
  })
