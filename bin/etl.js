#! /usr/bin/env node

const { program } = require('../src/utils/programInit')
const { jumpUrl, getAddresses, addAddresses } = require('../src/utils/etl')
const { successHandler } = require('../src/utils/common')

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
  .option('-e, --empty', 'delete all addresses')

program.parse(process.argv)

const { open, add, remove, list, check, empty } = program.opts()

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
    const key = program.args[program.args.length - 1] || strs[strs.length - 1]
    addressConf = { ...JSON.parse(addressConf), [key]: add }
    addAddresses(addressConf, {
      errorMsg: 'gla --add/-a error: ',
      successMsg: `The address named '${key}' has been instered!`
    })
  }, true)
}

// remove address
// TODO Confirm again
if (remove || remove === '') {
  getAddresses(data => {
    const originData = JSON.parse(data)
    delete originData[remove]
    addAddresses(originData, {
      errorMsg: 'gla --remove/-r error: ',
      successMsg: `The address named '${remove}' has been removed!`
    })
  })
}

// check address
if (check) {
  getAddresses(data => {
    successHandler(`${check} address is: ${JSON.parse(data)[check]}`)
  })
}

// delete all addresses
// TODO Confirm again
if (empty) {
  getAddresses(data => {
    addAddresses({}, {
      errorMsg: 'gla --empty/-e error: ',
      successMsg: 'All addresses have been deleted!'
    })
  })
}
