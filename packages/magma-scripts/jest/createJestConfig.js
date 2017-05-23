import config from '@lab009/magma-config'

const configSetupTestFrameworkScriptFile = config(
  'setupTestFrameworkScriptFile'
)
const setupTestFrameworkScriptFile = typeof configSetupTestFrameworkScriptFile ===
  'string' && configSetupTestFrameworkScriptFile !== ''
  ? configSetupTestFrameworkScriptFile
  : undefined

export default function createJestConfig(resolve, appRootDir) {
  const jestConfig = {
    collectCoverageFrom: [
      '**/*.{js,jsx}',
      '!**/(build|dist|public|docs|config|node_modules|local_modules)/**',
    ],
    setupTestFrameworkScriptFile,
    modulePaths: ['<rootDir>'],
    testPathIgnorePatterns: [
      '<rootDir>[/\\\\](build|dist|public|docs|config|node_modules|local_modules)[/\\\\]',
    ],
    testEnvironment: 'node',
    testURL: 'http://localhost',
    transform: {
      '^.+\\.(js|jsx)$': resolve('jest/babelTransform.js'),
      '^.+\\.css$': resolve('jest/cssTransform.js'),
      '^(?!.*\\.(js|jsx|css|json)$)': resolve('jest/fileTransform.js'),
    },
    transformIgnorePatterns: ['[/\\\\]node_modules[/\\\\].+\\.(js|jsx)$'],
  }
  if (appRootDir) {
    jestConfig.rootDir = appRootDir
  }
  return jestConfig
}
