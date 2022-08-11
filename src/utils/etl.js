#!/usr/bin/env zx

/*
 * @Author: luhaifeng666 youzui@hotmail.com
 * @Date: 2022-04-15 10:58:22
 * @LastEditors: luhaifeng666
 * @LastEditTime: 2022-08-11 15:16:23
 * @Description: 
 */

import 'zx/globals'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import inquirer from 'inquirer'
import { errorHandler, warningHandler, successHandler, __dirname } from './common.js'
import { PLATFORMS_TYPE } from '../constants/index.js'

dotenv.config({ path: path.join(__dirname, '../../.env') })


const { HOME, ETL_DIRECTORY } = process.env

export const BASE_URL = path.join(ETL_DIRECTORY || HOME, '/etl.json')

/**
 * jumpUrl
 * @param {String} url target url
 */
export const jumpUrl = async function (url) {
  let handleType = PLATFORMS_TYPE[process.platform]
  await $`${handleType} ${url}`
}

/**
 * getAddresses
 * @param {Function} cb call
 * @param {Boolean} isAdd add tag
 */
export const getAddresses = function (cb, isAdd = false) {
  fs.readFile(BASE_URL, { encoding: 'utf-8'}, (err, data) => {
    try {
      if (!isAdd && err) {
        if (err.code === 'ENOENT') {
          warningHandler(`There\'s no address in ${BASE_URL}! Try using 'add' command.`)
          return
        }
        throw err
      }
      cb(data)
    } catch (err) {
      errorHandler(`Get addresses error: ${err}`)
    }
  })
}

/**
 * addAddresses
 * @param {Object} data file data
 * @param {Object} msgConfig success message && error message
 */
export const addAddresses = function (data, { successMsg = 'Completed!', errorMsg = 'Error!'} = {
  successMsg: ''
}) {
  fs.writeFile(BASE_URL, JSON.stringify(data), err => {
    if (err) {
      errorHandler(`${errorMsg}${err}`)
    } else {
      successHandler(successMsg)
    }
  })
}

/**
 * promptCreator
 * @param {Object[]} configs 
 * @param {Function} cb 
 */
export const promptCreator = function (configs, cb) {
  inquirer.prompt(configs).then(answer => {
    cb(answer)
  }).catch(err => {
    errorHandler(err)
  })
}
