import express from 'express'
import { resolve as pathResolve } from 'path'
import appRootDir from 'app-root-dir'

import config from '@lab009/magma-config'

/**
 * Middleware to server our client bundle.
 */
export default express.static(pathResolve(appRootDir.get(), config('bundles.client.outputPath')), {
  maxAge: config('browserCacheMaxAge'),
})
