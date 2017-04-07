let values = {}

if (typeof process.env.BUILD_FLAG_IS_NODE === 'undefined') {
  const path = require('path')
  const appRootDir = require('app-root-dir').get()
  const configFileName = path.resolve(appRootDir, 'config/values.js')

  values = require(configFileName).default
} else if (process.env.BUILD_FLAG_IS_NODE === 'true') {
  values = require(process.env.MAGMA_CONFIG_VALUES).default
}

export default values
