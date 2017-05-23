#!/usr/bin/env node

/* eslint semi: ["error", "always"] */
/* eslint comma-dangle: ["error", "never"] */

const spawn = require('cross-spawn');
const script = process.argv[2];
const args = process.argv.slice(3);

switch (script) {
  case 'analyze':
  case 'build':
  case 'clean':
  case 'start':
  case 'test':
    var result = spawn.sync(
      'node',
      [
        '-r',
        require.resolve('./register'),
        require.resolve(`../scripts/${script}`)
      ].concat(args),
      {
        stdio: 'inherit'
      }
    );
    if (result.signal) {
      if (result.signal == 'SIGKILL') {
        console.log(
          'The build failed because the process exited too early. ' +
            'This probably means the system ran out of memory or someone called ' +
            '`kill -9` on the process.'
        );
      } else if (result.signal == 'SIGTERM') {
        console.log(
          'The build failed because the process exited too early. ' +
            'Someone might have called `kill` or `killall`, or the system could ' +
            'be shutting down.'
        );
      }
      process.exit(1);
    }
    process.exit(result.status);
    break;
  default:
    console.log(`Unknown script "${script}".`);
    console.log('Perhaps you need to update magma-scripts?');
    break;
}
