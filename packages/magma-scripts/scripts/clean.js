/**
 * This script removes any exisitng build output.
 */

import fs from 'fs-extra'
import { resolve as pathResolve } from 'path'
import appRootDir from 'app-root-dir'

import config from '../config'

fs.emptyDirSync(pathResolve(appRootDir.get(), config('buildOutputPath')))
