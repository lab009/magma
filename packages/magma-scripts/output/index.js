import notifier from 'node-notifier'

import colors from './colors'

function output(...args) {
  console.log(...args)
}

function info(message) {
  const titleFormatted = colors.formatTitle('info', 'I')
  output(titleFormatted, message)
}

function note(message) {
  const titleFormatted = colors.formatTitle('note', 'N')
  output(titleFormatted, message)
}

function warning(err) {
  printError('warning', err)
}

function error(err) {
  printError('error', err)
}

function printError(severity, err) {
  const titleFormatted = colors.formatTitle(severity, severity)

  output(titleFormatted, error.file ? `in ${error.file}` : '')
  output()
  output(err.message || err)
  output()
}

function log(options) {
  const { level, message, notify } = options
  const title = (options.title || level).toUpperCase()

  if (notify) {
    notifier.notify({
      title,
      message,
    })
  }

  const titleFormatted = colors.formatTitle(level, title)
  const messageFormatted = colors.formatText(level, message)
  output(titleFormatted, messageFormatted)
}

function clearConsole() {
  process.stdout.write('\x1bc')
}

export default {
  log,
  info,
  note,
  warning,
  error,
  printError,
  clearConsole,
}
