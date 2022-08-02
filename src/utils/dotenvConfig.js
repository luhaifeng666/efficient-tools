#! /usr/bin/env node

/*
 * @Author: haifeng.lu haifeng.lu@ly.com
 * @Date: 2022-08-02 17:56:44
 * @LastEditors: luhaifeng666
 * @LastEditTime: 2022-08-02 19:24:35
 * @Description: 
 */

const dotenv = require('dotenv')

// dotenv configuration
module.exports.dotenvInit = () => {
  const dotenvPath = path.join(__dirname, '../../.env')
  dotenv.config({ path: dotenvPath })
}