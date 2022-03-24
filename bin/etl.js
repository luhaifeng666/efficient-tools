#! /usr/bin/env node

const fs = require('fs')
const { program } = require('../src/utils/programInit')
const { BASE_URL, jumpUrl, getAddresses } = require('../src/utils/etl')
const { errorHandler, successHandler } = require('../src/utils/common')

/**
 * arguments defination
 * 1. -o/--open
 * 2. -a/--add
 * 3. -r/--remove
 * 4. -l/--list
 * 5. -c/--check
 */
program
  .option('-o, --open <key>', 'open an address')
  .option('-a, --add <address> [key]', 'add an address')
  .option('-r, --remove <key>', 'remove an address')
  .option('-l, --list', 'show all addresses')
  .option('-c, --check <key>', 'show an address')

program.parse(process.argv)

const { open, add, remove, list, check } = program.opts()

// open address
if (open) {
  getAddresses(data => { jumpUrl(JSON.parse(data)[open]) })
}

// print list
if (list) {
  getAddresses(data => {
    const originData = JSON.parse(data)
    const addressList = Object.keys(originData).reduce((list, key) => [
      ...list,
      [key, originData[key]]
    ], [])
    console.table(addressList)
  })
}

// add addresses
if (add) {
  getAddresses(data => {
    let addressConf = data || JSON.stringify({})
    const strs = add.split('/')
    const key = program.args.slice(-1) || strs[strs.length - 1]
    addressConf = { ...JSON.parse(addressConf), [key]: add }
    fs.writeFile(BASE_URL, JSON.stringify(addressConf), err => {
      err && errorHandler(`gla --add/-a error: ${err}`)
    })
  }, true)
}

// remove address
if (remove) {
  getAddresses(data => {
    const originData = JSON.parse(data)
    delete originData[remove]
    fs.writeFile(BASE_URL, JSON.stringify(originData), err => {
      err && errorHandler(`gla --remove/-r error: ${err}`)
    })
  })
}

// check address
if (check) {
  getAddresses(data => {
    successHandler(`${check} address is: ${JSON.parse(data)[check]}`)
  })
}
