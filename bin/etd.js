#! /usr/bin/env node

/**
 * efficient-tools-dictionary
 * An English-Chinese translation dictionary
 */
const CryptoJS = require('crypto-js')
const path = require('path')
const axios = require('axios')
const { version } = require('../package.json')
const { program } = require('../src/utils/programInit')
const { promptCreator } = require('../src/utils/etl')
const { successHandler, errorHandler, handleDotenv, handleDotenvCheck, notEmpty } = require('../src/utils/common')
const { dotenvInit } = require('../src/utils/dotenvConfig')
const { APP_ID, SECRET_KEY, LANGUAGES } = require('../src/constants/index.js')

dotenvInit()

program.version(version, '-v, --version')

program
  .option('-c, --config', 'add your appId and secret')
  .option('-l, --language', 'list all supported languages')
  .option('-t, --translate', 'translate')
  .option('-s, --set', 'set translation rule(from A to B)')
  .option('-r, --rule', 'print current translation rule')

program.parse(process.argv)

const { config, language, translate, set, rule } = program.opts()

function truncate (q) {
  const len = q.length
  if(len <= 20) return q
  return q.substring(0, 10) + len + q.substring(len - 10, len)
}

// get language key/name map
function getLanguageMap () {
  return Object.keys(LANGUAGES).reduce((obj, key) => ({
    ...obj,
    [LANGUAGES[key]]: key
  }), {})
}

// get from & to
function getFromAndTo () {
  const from = process.env.FROM || 'zh-CHS'
  const to = process.env.TO || 'en'
  return {
    from, to
  }
}

function handleTranslate (q) {
  const appKey = process.env.APP_ID
  const key = process.env.SECRET_KEY
  const salt = new Date().getTime()
  const curtime = Math.round(new Date().getTime() / 1000)
  const { from, to } = getFromAndTo()
  const str1 = appKey + truncate(q) + salt + curtime + key
  const sign = CryptoJS.SHA256(str1).toString(CryptoJS.enc.Hex)

  axios({
    method: 'get',
    url: 'http://openapi.youdao.com/api',
    params: { q, appKey, salt, from, to, sign, curtime, signType: 'v3' }
  })
  .then(function (response) {
    const { query, translation, web, basic } = response.data
    let res = `${query}: ${translation.toString()}`
    if (basic) {
      const { FROM, TO } = process.env
      if (FROM === 'en' && TO === 'zh-CHS') {
        res = `${query}: ${basic['us-phonetic'] ? `us: [${basic['us-phonetic']}]` : ''} ${basic['uk-phonetic'] ? `uk: [${basic['uk-phonetic']}]`  : ''}
${basic.explains.toString()}`
      } else if (FROM === 'zh-CHS' && TO === 'en') {
        res = `${query}: [${basic.phonetic || ''}]
${basic.explains.toString()}`
      }
    }
    successHandler(`------------------Translation Result------------------
${res}
`)
    if (web) {
      successHandler(`------------------Other Explanations------------------`)
      web.forEach(item => {
        successHandler(`${item.key} -> ${item.value.toString()}`)
      })
    }
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
      name: 'APP_ID',
      message: 'Please enter your appId',
      validate: notEmpty('The appId shouldn\'t be empty!')
    }, {
      type: 'input',
      name: 'SECRET_KEY',
      message: 'Please enter your secret-key',
      validate: notEmpty('The secret-key shouldn\'t be empty!')
    },
  ], answer => {
    handleDotenv(answer)
  })
}

// list all supported languages
if (language) {
  console.table(LANGUAGES)
}

// translate
if (translate) {
  handleDotenvCheck([APP_ID, SECRET_KEY], res => {
    if (res) {
      promptCreator([
        {
          type: 'input',
          name: 'question',
          message: 'What do you wanna translate?',
          validate: notEmpty('The translation content shouldn\'t be empty???')
        }
      ], answer => {
        handleTranslate(answer.question)
      })
    } else {
      errorHandler('appId or secret-key shouldn\'t be empty! Please config them first by "etd -c/--config" command.')
    }
  })
}

// set
if (set) {
  const choices = Object.keys(LANGUAGES).map(key => `${key}/${LANGUAGES[key]}`)
  const { from, to } = getFromAndTo()
  const languageMap = getLanguageMap()
  promptCreator([
    {
      type: 'list',
      name: 'FROM',
      message: 'Which kind of language do you wanna translate?',
      choices,
      default: choices.indexOf(`${languageMap[from]}/${from}`)
    }, {
      type: 'list',
      name: 'TO',
      message: 'What language do you want to translate into?',
      choices,
      default: choices.indexOf(`${languageMap[to]}/${to}`)
    }
  ], answer => {
    handleDotenv(Object.keys(answer).reduce((obj, key) => ({
      ...obj,
      [key]: answer[key].split('/')[1]
    }), {}))
  })
}

// print current translation rule
if (rule) {
  const { from, to } = getFromAndTo()
  const languageMap = getLanguageMap()
  successHandler(`The current translation rule is: from ${languageMap[from]}/${from} to ${languageMap[to]}/${to}.`)
}
