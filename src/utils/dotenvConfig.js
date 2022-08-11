#! /usr/bin/env node

/*
 * @Author: haifeng.lu haifeng.lu@ly.com
 * @Date: 2022-08-02 17:56:44
 * @LastEditors: luhaifeng666
 * @LastEditTime: 2022-08-11 14:43:43
 * @Description: 
 */

import dotenv from 'dotenv'
import { __dirname } from './common.js'

// dotenv configuration
export const dotenvInit = () => {
  const dotenvPath = path.join(__dirname, '../../.env')
  dotenv.config({ path: dotenvPath })
}