#! /usr/bin/env node

/*global process */

/**
 * efficient-tools-dictionary
 * An English-Chinese translation dictionary
 */
import CryptoJS from 'crypto-js'
import axios from 'axios'
import { program } from '../src/utils/programInit.js'
import { promptCreator } from '../src/utils/etl.js'
import { successHandler, errorHandler, handleDotenv, handleDotenvCheck, notEmpty } from '../src/utils/common.js'
import { dotenvInit } from '../src/utils/dotenvConfig.js'
import { APP_ID, SECRET_KEY, LANGUAGES, MICROSOFT_LANGUAGES, MICROSOFT_SECRET_KEY, TRANSLATION_TYPES } from '../src/constants/index.js'
import { v4 as uuidv4 } from 'uuid'

dotenvInit()

program
	.option('-c, --config', 'add your appId and secret')
	.option('-l, --language', 'list all supported languages')
	.option('-t, --translate', 'translate')
	.option('-s, --set', 'set translation rule(from A to B)')
	.option('--service', 'set or switch the type of translation service')
	.option('-r, --rule', 'print current translation rule')

program.parse(process.argv)

const { config, language, translate, set, rule, service } = program.opts()

function truncate (q) {
	const len = q.length
	if(len <= 20) return q
	return q.substring(0, 10) + len + q.substring(len - 10, len)
}

// get language key/name map
function getLanguageMap () {
	return Object.keys(getLanguages()).reduce((obj, key) => ({
		...obj,
		[getLanguages()[key]]: key
	}), {})
}

// get from and to default value
function getFromAndToDefaultValue(service) {
	const defaultValue = {
		youdao: { from: 'en', to: 'zh-CHS' },
		microsoft: { from: 'en', to: 'zh-Hans' }
	}
	return defaultValue[service || getTranslationServiceType()]
}

// get from & to
function getFromAndTo () {
	const { from: defaultFrom, to: defaultTo } = getFromAndToDefaultValue()
	const from = process.env.FROM || defaultFrom
	const to = process.env.TO || defaultTo
	return {
		from, to
	}
}

// get translation service type
function getTranslationServiceType() {
	return process.env.TRANSLATOR_SERVICE_TYPE || 'youdao'
}

// get languages
function getLanguages() {
	const languageMap = {
		youdao: LANGUAGES,
		microsoft: MICROSOFT_LANGUAGES
	}
	return languageMap[getTranslationServiceType()]
}

// get translation result
function printTranslationResult(res) {
	successHandler(`------------------Translation Result------------------
${res}
`)
}

// youdao translator
async function handleTranslateReq (q) {
	const appKey = process.env.APP_ID
	const key = process.env.SECRET_KEY
	const salt = new Date().getTime()
	const curtime = Math.round(new Date().getTime() / 1000)
	const { from, to } = getFromAndTo()
	const str1 = appKey + truncate(q) + salt + curtime + key
	const sign = CryptoJS.SHA256(str1).toString(CryptoJS.enc.Hex)
	let data = {}

	try {
		const res = await axios({
			method: 'get',
			url: 'http://openapi.youdao.com/api',
			params: { q, appKey, salt, from, to, sign, curtime, signType: 'v3' }
		})
		data = res.data || {}
	} catch (e) {
		errorHandler(e.message || 'No results!')
	}
	return data
}

// microsoft translator
async function handleMicrosoftTranslateReq (text) {
	const { MICROSOFT_SECRET_KEY, MIRCOSOFT_LOCATION = 'global' } = process.env
	const { from, to } = getFromAndTo()
	const endpoint = 'https://api-apc.cognitive.microsofttranslator.com'

	// Add your location, also known as region. The default is global.
	// This is required if using a Cognitive Services resource.

	axios({
		baseURL: endpoint,
		url: '/translate',
		method: 'post',
		headers: {
			'Ocp-Apim-Subscription-Key': MICROSOFT_SECRET_KEY,
			'Ocp-Apim-Subscription-Region': MIRCOSOFT_LOCATION,
			'Content-type': 'application/json',
			'X-ClientTraceId': uuidv4().toString()
		},
		params: {
			'api-version': '3.0',
			from, to,
			'includeAlignment': true,
			'textType': 'html',
			// 'profanityAction': 'marked'
		},
		data: [{
			text
		}],
		responseType: 'json'
	}).then(( { data } ) => {
		const res = (data || []).reduce((str, item) => {
			const { translations = [] } = item
			return str + translations.map(({ text }) => text).join(', ')
		}, '')
		printTranslationResult(`${text}: ${res}`)
	})
}

// get microsoft translator support languages


/**
 * parse result
 * @param {Object} data 
 */
function handleParse(data) {
	try {
		const { query, translation, web, basic } = data
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
		printTranslationResult(res)
		if (web) {
			successHandler('------------------Other Explanations------------------')
			web.forEach(item => {
				successHandler(`${item.key} -> ${item.value.toString()}`)
			})
		}
	} catch(error) {
		errorHandler(error.message || 'No results!')
	}
}

// get tip message
function getTipMessage(service) {
	const message = {
		youdao: 'You need to go to https://ai.youdao.com/#/ to register first!!',
		microsoft: 'For more infomation on using it, refer to https://docs.microsoft.com/zh-cn/azure/cognitive-services/translator/quickstart-translator.'
	}
	return message[service]
}

// get creator items
function getCreatorItems(service) {
	let creatorItem = []
	switch(service) {
	case 'youdao':
		creatorItem = [
			{
				type: 'input',
				name: 'APP_ID',
				message: 'Please enter your appId',
				validate: notEmpty('The youdao translation service\'s appId shouldn\'t be empty!')
			}, {
				type: 'input',
				name: 'SECRET_KEY',
				message: 'Please enter your secret-key',
				validate: notEmpty('The youdao translation service\'s secret-key shouldn\'t be empty!')
			},
		]
		break
	case 'microsoft':
		creatorItem = [{
			type: 'input',
			name: 'MICROSOFT_SECRET_KEY',
			message: 'Please type your microsoft translation service\'s secret key',
			validate: notEmpty('The microsoft translation service\'s secret key shouldn\'t be empty!')
		}, {
			type: 'input',
			name: 'MIRCOSOFT_LOCATION',
			message: 'Please type your microsoft translation location code',
			default: 'global',
			validate: notEmpty('Please type your microsoft translation location code shouldn\'t be empty!') 
		}]
		break
	}
	return creatorItem
}

// service prompt
function servicePrompt(fn, msg = '') {
	promptCreator([
		{
			type: 'list',
			name: 'TRANSLATOR_SERVICE_TYPE',
			choices: TRANSLATION_TYPES,
			message: 'Please choose the type of translation service',
			default: 0
		}
	], ({ TRANSLATOR_SERVICE_TYPE }) => {
		const { from: FROM, to: TO } = getFromAndToDefaultValue(TRANSLATOR_SERVICE_TYPE)
		handleDotenv({
			TRANSLATOR_SERVICE_TYPE, FROM, TO
		}, msg)
		fn && fn(TRANSLATOR_SERVICE_TYPE)
	})
}

// set the type of translation service
if (service) {
	servicePrompt()
}

// add appId && secret
if (config) {
	servicePrompt(service => {
		successHandler(`
    **** TIP
    ${getTipMessage(service)}
    ****
  `)
		promptCreator(getCreatorItems(service), answer => {
			handleDotenv(answer)
		})
	})
}

// list all supported languages
if (language) {
	console.table(getLanguages())
}

// translate
if (translate) {
	const VALIDATE_KEYS = {
		youdao: [APP_ID, SECRET_KEY],
		microsoft: [MICROSOFT_SECRET_KEY]
	}
	const key = getTranslationServiceType()
	const keys = VALIDATE_KEYS[key]
	handleDotenvCheck(keys, res => {
		if (res) {
			promptCreator([
				{
					type: 'input',
					name: 'question',
					message: 'What do you wanna translate?',
					validate: notEmpty('The translation content shouldn\'t be empty！')
				}
			], async ({ question }) => {
				switch(key) {
				case 'youdao': {
					const data = await handleTranslateReq(question)
					handleParse(data)
					break
				}
				case 'microsoft':
					handleMicrosoftTranslateReq(question)
					break
				default: break
				}
			})
		} else {
			errorHandler(`${keys.map(key => key.toLowerCase()).join(' or ')} shouldn't be empty! Please config them first by "etd -c/--config" command.`)
		}
	})
}

// set
if (set) {
	const choices = Object.keys(getLanguages()).map(key => `${key}/${getLanguages()[key]}`)
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
