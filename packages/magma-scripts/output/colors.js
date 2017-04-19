import chalk from 'chalk'

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

function textColor(level) {
  switch (level.toLowerCase()) {
    case 'success':
      return 'green'
    case 'info':
      return 'blue'
    case 'note':
      return 'white'
    case 'warning':
      return 'yellow'
    case 'error':
      return 'red'
    default:
      return 'red'
  }
}

function bgColor(level) {
  const color = textColor(level)
  return `bg${capitalizeFirstLetter(color)}`
}

function formatTitle(level, message) {
  return chalk[bgColor(level)].black('', message, '')
}

function formatText(level, message) {
  return chalk[textColor(level)](message)
}

export default {
  textColor,
  bgColor,
  formatTitle,
  formatText,
}
