#!/usr/bin/env zx

require('zx/globals')
const { errorHandler, warningHandler } = require('./common')
const fs = require('fs')
const path = require('path')
const { PLATFORMS_TYPE } = require('../constants/index.js')

const BASE_URL = path.join(process.env.HOME, '/gla.json')

module.exports.BASE_URL = BASE_URL

/**
 * jumpUrl
 * @param {String} url target url
 */
module.exports.jumpUrl = async function (url) {
  let handleType = PLATFORMS_TYPE[process.platform]
  await $`${handleType} ${url}`
}

/**
 * getAddresses
 * @param {Function} cb call
 * @param {Boolean} isAdd add tag
 */
module.exports.getAddresses = function (cb, isAdd = false) {
  fs.readFile(BASE_URL, (err, data) => {
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
