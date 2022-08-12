#! /usr/bin/env node

/*global process */

/**
 * efficient-tools-link
 * A tool to help you open a link quickly.
 */

import fs from 'fs'
import path from 'path'
import qrcode from 'qrcode-terminal'
import { program } from '../src/utils/programInit.js'
import { jumpUrl, getAddresses, addAddresses, promptCreator, BASE_URL } from '../src/utils/etl.js'
import { successHandler, errorHandler, handleDotenv, notEmpty, isObject } from '../src/utils/common.js'
import { dotenvInit } from '../src/utils/dotenvConfig.js'

dotenvInit()

/**
 * arguments defination
 */
program
	.option('-o, --open <key>', 'open an address')
	.option('-a, --add <address> [key]', 'add an address')
	.option('-r, --remove <key...>', 'remove addresses')
	.option('-l, --list', 'show all addresses')
	.option('-c, --check <key>', 'show an address')
	.option('-e, --empty', 'delete all addresses')
	.option('-d, --derive', 'export all addresses to the target file')
	.option('-i, --init <filePath>', 'insert addresses to local')
	.option('-m, --modify', 'modify name or address')
	.option('-w, --where', 'show the path of the configuration file')
	.option('--directory', 'set custom filepath')

program.parse(process.argv)

const {
	open, add, remove, list, check, empty, derive, init, directory, modify, where
} = program.opts()

/**
 * set count number
 * @param {*} key target key
 */
function setCount(key) {
	getAddresses(data => {
		const originData = JSON.parse(data)
		originData[key].count += 1
		addAddresses(originData)
	})
}

// open address
if (open) {
	getAddresses(data => {
		const { link } = JSON.parse(data)[open]
		if (link) {
			setCount(open)
			jumpUrl(link)
		} else {
			errorHandler(`Address named ${open} does not exist! You can try using 'etl -a/--add' command first.`)
		}
	})
}

// print list
if (list) {
	getAddresses(data => {
		// Compatible with the original configuration
		let originalData = JSON.parse(data)
		const isValidate = Object.values(originalData).every(item => isObject(item))
		if (!isValidate) {
			originalData = Object.keys(originalData).reduce((obj, key) => ({
				...obj,
				[key]: isObject(originalData[key]) ? originalData[key] : {
					link: originalData[key],
					count: 0
				}
			}), {})
			addAddresses(originalData, {
				errorMsg: 'etl --add/-a error: ',
				successMsg: 'Addresses have been transformed!'
			})
		}
		// get total counts
		const totalCounts = Object.values(originalData).reduce((num, { count }) => num + count, 0)
		console.table(
			Object.keys(originalData).reduce((obj, key) => ({
				...obj,
				[key]: {
					...originalData[key],
					'percentage(%)': `${totalCounts ? ((originalData[key].count / totalCounts) * 100).toFixed(2) : '0.00'}%`
				}
			}), {})
		)
	})
}

// add addresses
if (add) {
	getAddresses(data => {
		let addressConf = data || JSON.stringify({})
		const strs = add.split('/')
		const key = program.args[program.args.length - 1] || strs[strs.length - 1]
		addressConf = { ...JSON.parse(addressConf), [key]: {
			link: add,
			count: 0
		}}
		addAddresses(addressConf, {
			errorMsg: 'etl --add/-a error: ',
			successMsg: `The address named '${key}' has been instered!`
		})
	}, true)
}

// remove address
if (remove) {
	promptCreator([
		{
			type: 'confirm',
			name: 'deleteAddress',
			message: 'Are you sure to delete these addresses?',
			default: false
		}
	], answer => {
		answer['deleteAddress'] && getAddresses(data => {
			const originData = JSON.parse(data)
			remove.forEach(key => {
				if (originData[key]) {
					delete originData[key]
				} else {
					errorHandler(`Address named ${key} does not exist!`)
				}
			})
			addAddresses(originData, {
				errorMsg: 'etl --remove/-r error: ',
				successMsg: `The address named '${remove}' has been removed!`
			})
		})
	})
}

// check address
if (check) {
	getAddresses(data => {
		setCount(check)
		successHandler(`The ${check} address is: ${JSON.parse(data)[check].link}.
You can use your mobile device to scan the QR code below to browse`)
		qrcode.generate(JSON.parse(data)[check], { small: true })
	})
}

// delete all addresses
if (empty) {
	promptCreator([
		{
			type: 'confirm',
			name: 'deleteAll',
			message: 'Are you sure to delete all addresses?',
			default: false
		}
	], answer => {
		answer['deleteAll'] && getAddresses(data => {
			addAddresses({}, {
				errorMsg: 'etl --empty/-e error: ',
				successMsg: 'All addresses have been deleted!'
			})
		})
	})
}

// export address configuration
if (derive) {
	promptCreator([
		{
			type: 'input',
			name: 'filename',
			message: 'What is the filename?',
			default: 'addresses.json'
		}
	],answer => {
		const { filename } = answer
		getAddresses(data => {
			const dir = path.join(process.env.PWD, `${filename}`)
			fs.writeFile(dir, data, err => {
				if (err) {
					errorHandler(err)
				} else {
					successHandler(`Derivation completed！File in ${dir}`)
				}
			})
		})
	})
}

// insert addresses to local
if (init) {
	fs.readFile(init, { encoding: 'utf-8'}, (err, content) => {
		if (err) {
			errorHandler(err)
		} else {
			getAddresses(data => {
				let addressConf = data || '{}'
				addressConf = { ...JSON.parse(addressConf), ...JSON.parse(content || '{}') }
				addAddresses(addressConf, {
					errorMsg: 'Failed to initialize!',
					successMsg: 'Initialized!'
				})
			}, true)
		}
	})
}

// modify name or address
if (modify) {
	getAddresses(data => {
		const originData = JSON.parse(data || '{}')
		const choices = Object.keys(originData)
		promptCreator([
			{
				type: 'list',
				name: 'name',
				message: 'Which address do you wanna modify?',
				choices,
				default: 0
			}, {
				type: 'list',
				name: 'type',
				message: 'What do you wanna change?',
				choices: ['name', 'address'],
				default: 'name'
			}, {
				type: 'input',
				name: 'content',
				message: 'Please enter what you wanna override',
				validate: notEmpty('The name or address shouldn\'t be empty!')
			}
		], answer => {
			const { name, type, content } = answer
			let messages = {}
			if (type === 'name') {
				originData[content] = originData[name]

				delete originData[name]

				messages = {
					errorMsg: 'Failed to modify the name!',
					successMsg: 'Name modified!'
				}
			} else {
				originData[name] = content
				messages = {
					errorMsg: 'Failed to modify the address!',
					successMsg: 'Address modified!'
				}
			}
			addAddresses(originData, messages)
		})
	})
}

// set custom filepath
if (directory) {
	promptCreator([
		{
			type: 'input',
			name: 'ETL_DIRECTORY',
			message: 'In which directory are the addresses stored?',
			validate: answer => {
				if (!(answer.trim())) {
					return 'Directory shouldn\'t be empty!'
				}
				const target = answer.split('/').slice(-1)[0]
				if (target.includes('.')) {
					return 'Directory shouldn\'t be a filepath!'
				}
				return true
			}
		}
	], answer => {
		handleDotenv(answer, `Setup completed! The addresses will be saved to ${answer.ETL_DIRECTORY}`)
	})
}

// show the path of the configuration file
where && successHandler(`The configuration filepath is: ${BASE_URL}`)
