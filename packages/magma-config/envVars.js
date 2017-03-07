/**
 * Helper for resolving environment specific configuration files.
 *
 * It resolves .env files that are supported by the `dotenv` library.
 *
 * Please read the application configuration docs for more info.
 */

import fs from 'fs-extra'
import path from 'path'
import appRootDir from 'app-root-dir'
import dotenv from 'dotenv'
import ifElse from '@lab009/magma-utils/logic/ifElse'
import removeNil from '@lab009/magma-utils/arrays/removeNil'

function registerEnvFile() {
  const NODE_ENV = process.env.NODE_ENV
  const envFile = '.env'

  // This is the order in which we will try to resolve an environment configuration
  // file.
  const envFileResolutionOrder = removeNil([
    // Is there an environment config file at the app root for our target
    // environment name?
    // e.g. /projects/.env.staging
    ifElse(NODE_ENV)(path.resolve(appRootDir.get(), `${envFile}.${NODE_ENV}`)),
    // Is there an environment config file at the app root?
    // e.g. /projects/.env
    path.resolve(appRootDir.get(), envFile),
  ])

  // Find the first env file path match.
  const envFilePath = envFileResolutionOrder.find(filePath => fs.existsSync(filePath))

  // If we found an env file match the register it.
  if (envFilePath) {
    console.log(`Registering environment variables from: ${envFilePath}`)
    dotenv.config({ path: envFilePath })
  }
}

// Ensure that we first register any environment variables from an existing
// env file.
registerEnvFile()

/**
 * Gets a string environment variable by the given name.
 *
 * @param  {String} name - The name of the environment variable.
 * @param  {String} defaultVal - The default value to use.
 *
 * @return {String} The value.
 */
function string(name, defaultVal) {
  return process.env[name] || defaultVal
}

/**
 * Gets a number environment variable by the given name.
 *
 * @param  {String} name - The name of the environment variable.
 * @param  {number} defaultVal - The default value to use.
 *
 * @return {number} The value.
 */
function number(name, defaultVal) {
  return process.env[name]
    ? parseInt(process.env[name], 10)
    : defaultVal
}

function bool(name, defaultVal) {
  return process.env[name]
    ? process.env[name] === 'true' || process.env[name] === '1'
    : defaultVal
}

// EXPORTED HELPERS

export default {
  string,
  number,
  bool,
}