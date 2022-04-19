#!/usr/bin/env zx

require('zx/globals')
const { readFile, writeFile } = require('fs')
const dotenv = require('dotenv')
const path = require('path')

const BASE_URL = path.join(__dirname, '../../.env')

/**
 * error handler
 * @param {String} msg 
 */
const errorHandler = msg => {
  console.error(chalk.red(msg))
}

/**
 * warning handler
 * @param {String} msg 
 */
 const warningHandler = msg => {
  console.warn(chalk.yellowBright(msg))
}

/**
 * success handler
 * @param {String} msg 
 */
 const successHandler = msg => {
  console.log(chalk.greenBright(msg))
}

const getDotenvContent = cb => {
  readFile(BASE_URL, { encoding: 'utf-8'}, (err, data) => {
    try {
      if (err) throw err
      const buf = Buffer.from(data)
      cb(dotenv.parse(buf))
    } catch (e) {
      errorHandler(e.message)
    }
  })
}

/**
 * config the .env file
 * @param {*} config 
 * @param {*} msg 
 */
const handleDotenv = (config, msg = 'Config successfully!') => {
  getDotenvContent(res => {
    const content = { ...res, ...config }
    const envConfig = Object.keys(content).reduce((str, key) => `${str}
${key}=${content[key]}`.trim(), '')
    writeFile(BASE_URL, envConfig, err => {
      if (err) {
        errorHandler(err.message)
      } else {
        successHandler(msg)
      }
    })
  })
}

/**
 * check .env file
 * @param {*} keys 
 * @param {*} cb 
 */
const handleDotenvCheck = (keys, cb) => {
  if (Array.isArray(keys)) {
    getDotenvContent(data => {
      const res = keys.every(key => data[key])
      cb(res)
    })
  } else {
    errorHandler('"Keys" must be an array.')
  }
}

/**
 * inquirer validate
 * @param {*} msg 
 */
const notEmpty = msg => {
  return answer => {
    if (!(answer.trim())) {
      return msg
    }
    return true
  }
}

module.exports = {
  errorHandler,
  successHandler,
  warningHandler,
  handleDotenv,
  handleDotenvCheck,
  notEmpty
}
