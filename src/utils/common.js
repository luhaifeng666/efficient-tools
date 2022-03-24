#!/usr/bin/env zx

require('zx/globals')

/**
 * error handler
 * @param {String} msg 
 */
module.exports.errorHandler = msg => {
  console.error(chalk.red(msg))
}

/**
 * warning handler
 * @param {String} msg 
 */
 module.exports.warningHandler = msg => {
  console.warn(chalk.yellowBright(msg))
}

/**
 * success handler
 * @param {String} msg 
 */
 module.exports.successHandler = msg => {
  console.log(chalk.greenBright(msg))
}