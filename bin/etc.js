#! /usr/bin/env node
/*global process */

/*
 * @Author: haifeng.lu haifeng.lu@ly.com
 * @Date: 2022-08-02 16:46:11
 * @LastEditors: luhaifeng666
 * @LastEditTime: 2022-08-12 17:47:44
 * @Description: 
 */

import path from 'path'
import { copyFile } from 'fs/promises'
import { program } from '../src/utils/programInit.js'
import { promptCreator } from '../src/utils/etl.js'
import { dotenvInit } from '../src/utils/dotenvConfig.js'
import { successHandler, errorHandler, notEmpty, handleDotenv, __dirname } from '../src/utils/common.js'

// dotenv configuration
const dotenvPath = path.join(__dirname, '../../.env')
dotenvInit()

program
	.option('-i, --init', 'init ET configuration')
	.option('-e, --export', 'export ET configuration')

program.parse(process.argv)

const { init, export: _export } = program.opts()

// init ET configuration
if (init) {
	promptCreator([
		{
			type: 'list',
			name: 'way',
			message: 'How to init the ET configuration?',
			choices: [
				{
					name: 'According to the .env.backup file',
					value: 0
				}, {
					name: 'By setting attributes',
					value: 1
				}],
			default: 0
		}
	], answer => {
		const { way } = answer
		const choices = [
			{
				value: 0,
				name: 'The Youdao appId',
				key: 'APP_ID'
			},
			{
				value: 1,
				name: 'The Youdao secret key',
				key: 'SECRET_KEY'
			},
			{
				value: 2,
				name: 'The tinify apiKey',
				key: 'TINIFY_API_KEY'
			}
		]
		const questions = !way ? [
			{
				type: 'input',
				name: 'backupPath',
				message: 'Please type the .env.backup filepath(without `.env.backup`):',
				validate: notEmpty('The .env.backup filepath is required.')
			}
		] : [
			{
				type: 'checkbox',
				name: 'attributes',
				message: 'Please choose attributes that you wanna config:',
				choices
			}
		]
		promptCreator(questions, async answer => {
			try {
				const { backupPath, attributes } = answer
				const successMsg = 'Initialization completed!'
				if (backupPath) {
					await copyFile(`${backupPath}/.env.backup`, path.resolve(__dirname, '../../', '.env'))
					successHandler(successMsg)
				} else {
					promptCreator(choices.filter(
						({ value }) => attributes.includes(value)
					).map(({ name: message, key: name }) => ({
						type: 'input',
						message,
						name
					})), answer => {
						handleDotenv(Object.keys(answer).reduce((obj, key) => ({
							...obj,
							[key]: answer[key]
						}), {}), successMsg, dotenvPath) 
					})
				}
			} catch (e) {
				errorHandler(e.message)
			}
		})
	})
}

// export ET configuration
if (_export) {
	promptCreator([
		{
			type: 'input',
			name: 'name',
			message: 'Please type the directory where you wanna backup the ET configuration(absolute path):',
			default: process.env.PWD
		}
	], async answer => {
		try {
			const { name } = answer
			const targetPath = `${name}/.env.backup`
			await copyFile(path.resolve(__dirname, '../../', '.env'), targetPath)
			successHandler(`Backup completed! The filepath is: ${targetPath}`)
		} catch (e) {
			errorHandler(e.message)
		}
	})
}
