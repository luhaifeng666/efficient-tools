#!/usr/bin/env zx

import 'zx/globals'
import dotenv from 'dotenv'
import path from 'path'
import { readFile, writeFile } from 'fs'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __filename = fileURLToPath(import.meta.url)
export const __dirname = path.dirname(__filename)

const BASE_URL = path.join(__dirname, '../../.env')

/**
 * error handler
 * @param {String} msg 
 */
export const errorHandler = msg => {
  console.error(chalk.red(msg))
}

/**
 * warning handler
 * @param {String} msg 
 */
export const warningHandler = msg => {
  console.warn(chalk.yellowBright(msg))
}

/**
 * success handler
 * @param {String} msg 
 */
export  const successHandler = msg => {
  console.log(chalk.greenBright(msg))
}

export const getDotenvContent = (baseUrl, cb) => {
  readFile(baseUrl, { encoding: 'utf-8'}, (err, data) => {
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
export const handleDotenv = (config, msg = 'Config successfully!', filepath = BASE_URL) => {
  getDotenvContent(filepath, res => {
    const content = { ...res, ...config }
    const envConfig = Object.keys(content).reduce((str, key) => `${str}
${key}=${content[key]}`.trim(), '')
    writeFile(filepath, envConfig, err => {
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
export const handleDotenvCheck = (keys, cb, baseUrl = BASE_URL) => {
  if (Array.isArray(keys)) {
    getDotenvContent(baseUrl, data=> {
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
export const notEmpty = msg => {
  return answer => {
    if (!(answer.trim())) {
      return msg
    }
    return true
  }
}

export const promisify = handler => new Promise(handler)

/**
 * Validate if the accept value is an Object
 * @param {any} val 
 * @returns 
 */
export const isObject = val => val !== null && Object.prototype.toString.call(val) === '[object Object]'

// get package version code
export const getVersion = () => {
  const require = createRequire(import.meta.url)
  const { version } = require('../../package.json')
  return version
}
