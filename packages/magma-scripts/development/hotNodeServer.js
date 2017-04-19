import path from 'path'
import appRootDir from 'app-root-dir'
import { spawn } from 'child_process'

import output from '../output'

class HotNodeServer {
  constructor(name, compiler, clientCompiler) {
    const compiledEntryFile = path.resolve(appRootDir.get(), compiler.options.output.path, `${Object.keys(compiler.options.entry)[0]}.js`)

    const startServer = () => {
      if (this.server) {
        this.server.kill()
        this.server = null
        output.log({
          level: 'info',
          title: name,
          message: 'Restarting server...',
        })
      }

      const newServer = spawn('node', [compiledEntryFile])

      output.log({
        level: 'info',
        title: name,
        message: 'Server running with latest changes.',
        notify: true,
      })

      newServer.stdout.on('data', data => output.note(data.toString().trim()))
      newServer.stderr.on('data', (data) => {
        output.log({
          level: 'error',
          title: name,
          message: 'Error in server execution, check the console for more info.',
        })
        output.error(data.toString().trim())
      })
      this.server = newServer
    }

    // We want our node server bundles to only start after a successful client
    // build.  This avoids any issues with node server bundles depending on
    // client bundle assets.
    const waitForClientThenStartServer = () => {
      if (this.serverCompiling) {
        // A new server bundle is building, break this loop.
        return
      }
      if (this.clientCompiling) {
        setTimeout(waitForClientThenStartServer, 50)
      } else {
        startServer()
      }
    }

    clientCompiler.plugin('compile', () => {
      this.clientCompiling = true
    })

    clientCompiler.plugin('done', (stats) => {
      if (!stats.hasErrors()) {
        this.clientCompiling = false
      }
    })

    compiler.plugin('compile', () => {
      this.serverCompiling = true
      output.log({
        level: 'info',
        title: name,
        message: 'Building new bundle...',
      })
    })

    compiler.plugin('done', (stats) => {
      this.serverCompiling = false

      if (this.disposing) {
        return
      }

      try {
        if (stats.hasErrors()) {
          output.log({
            level: 'error',
            title: name,
            message: 'Build failed, check the console for more information.',
            notify: true,
          })
          stats.compilation.errors.forEach(output.error)
          return
        }

        waitForClientThenStartServer()
      } catch (err) {
        output.log({
          level: 'error',
          title: name,
          message: 'Failed to start, please check the console for more information.',
          notify: true,
        })
        output.error(err)
      }
    })

    // Lets start the compiler.
    this.watcher = compiler.watch(null, () => undefined)
  }

  dispose() {
    this.disposing = true

    const stopWatcher = new Promise((resolve) => {
      this.watcher.close(resolve)
    })

    return stopWatcher.then(() => {
      if (this.server) this.server.kill()
    })
  }
}

export default HotNodeServer
