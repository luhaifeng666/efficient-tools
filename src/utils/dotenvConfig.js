#! /usr/bin/env node

/*
 * @Author: haifeng.lu haifeng.lu@ly.com
 * @Date: 2022-08-02 17:56:44
 * @LastEditors: haifeng.lu
 * @LastEditTime: 2022-08-02 18:00:40
 * @Description: 
 */

const dotenv = require('dotenv')

const dotenvPath = path.join(process.env.PWD, '.env')

module.exports.dotenvPath = dotenvPath

// dotenv configuration
module.exports.dotenvInit = () => {
  dotenv.config({ path: dotenvPath })
}