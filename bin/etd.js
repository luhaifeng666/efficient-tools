#! /usr/bin/env node

/**
 * efficient-tools-dictionary
 * An English-Chinese translation dictionary
 */
const CryptoJS = require('crypto-js')
const dotenv = require('dotenv')
const path = require('path')
const axios = require('axios')
const { writeFile } = require('fs')
const { version } = require('../package.json')
const { program } = require('../src/utils/programInit')
const { promptCreator } = require('../src/utils/etl')
const { successHandler, errorHandler } = require('../src/utils/common')

const dotenvPath = path.join(__dirname, '../.env')
dotenv.config({ path: dotenvPath })

program.version(version, '-v, --version')

program
  .option('-c, --config', 'add your appId and secret')
  .option('-l, --language', 'list all supported languages')
  .option('-t, --translate', 'translate')
  .option('-s, --set', 'from A to B')

program.parse(process.argv)

const { config, language, translate, set } = program.opts()

function truncate (q) {
  const len = q.length
  if(len <= 20) return q
  return q.substring(0, 10) + len + q.substring(len - 10, len)
}

function handleTranslate (q) {
  const appKey = process.env.APP_ID
  const key = process.env.SECRET_KEY
  const salt = new Date().getTime()
  const curtime = Math.round(new Date().getTime() / 1000)
  const from = 'zh-CHS'
  const to = 'en'
  const str1 = appKey + truncate(q) + salt + curtime + key
  const sign = CryptoJS.SHA256(str1).toString(CryptoJS.enc.Hex)

  axios({
    method: 'get',
    url: 'http://openapi.youdao.com/api',
    params: { q, appKey, salt, from, to, sign, curtime, signType: 'v3' }
  })
  .then(function (response) {
    console.log(response)
  })
  .catch(function (error) {
    errorHandler(error.message || 'No results!')
  })
}

// add appId && secret
if (config) {
  successHandler(`
    **** TIP
    You need to go to https://ai.youdao.com/#/ to register first!!
    ****
  `)
  promptCreator([
    {
      type: 'input',
      name: 'appid',
      message: 'Please enter your appId'
    }, {
      type: 'input',
      name: 'secretKey',
      message: 'Please enter your secret-key'
    },
  ], answer => {
    console.log(answer)
  })
}

// list all supported languages
if (language) {}

// translate
if (translate) {}

// set
if (set) {}
