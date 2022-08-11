/*
 * @Author: luhaifeng666 youzui@hotmail.com
 * @Date: 2022-03-24 23:03:22
 * @LastEditors: luhaifeng666
 * @LastEditTime: 2022-08-11 14:57:43
 * @Description: 
 */
import { Command } from 'commander'
import { getVersion } from './common.js'

const commander = new Command()

commander.version(getVersion(), '-v, --version')

export const program = commander
