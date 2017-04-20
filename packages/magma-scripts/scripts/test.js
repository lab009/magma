/**
 * This script test application
 */

import jest from 'jest'
import appRootDir from 'app-root-dir'
import { resolve as pathResolve } from 'path'
import createJestConfig from '../jest/createJestConfig'

process.env.NODE_ENV = 'test'

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', (err) => {
  throw err
})

const argv = process.argv.slice(2)

// This is not necessary after eject because we embed config into package.json.
argv.push('--config', JSON.stringify(createJestConfig(relativePath => pathResolve(__dirname, '..', relativePath), appRootDir.get())))

jest.run(argv)
