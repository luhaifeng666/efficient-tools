#! /usr/bin/env node
const fs = require('fs')
const path = require('path')
const { program } = require('../src/utils/programInit')
const { jumpUrl, getAddresses, addAddresses, promptCreator } = require('../src/utils/etl')
const { successHandler, errorHandler } = require('../src/utils/common')

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
  .option('-d, --derive', 'export all addresses to the target file')
  .option('-i, --init <filePath>', 'insert addresses to local')

program.parse(process.argv)

const { open, add, remove, list, check, empty, derive, init } = program.opts()

// open address
if (open) {
  getAddresses(data => {
    const url = JSON.parse(data)[open] || ''
    if (url) {
      jumpUrl(url)
    } else {
      errorHandler(`Address named ${open} does not exist! You can try using 'etl -a/--add' command first.`)
    }
  })
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
      errorMsg: 'etl --add/-a error: ',
      successMsg: `The address named '${key}' has been instered!`
    })
  }, true)
}

// remove address
if (remove || remove === '') {
  promptCreator([
    {
      type: 'confirm',
      name: 'deleteAddress',
      message: 'Are you sure to delete this addresses?',
      default: false
    }
  ], answer => {
    answer['deleteAddress'] && getAddresses(data => {
      const originData = JSON.parse(data)
      if (originData[remove]) {
        delete originData[remove]
        addAddresses(originData, {
          errorMsg: 'etl --remove/-r error: ',
          successMsg: `The address named '${remove}' has been removed!`
        })
      } else {
        errorHandler(`Address named ${remove} does not exist!`)
      }
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
      default: 'addresses'
    }
  ],answer => {
    const { filename } = answer
    getAddresses(data => {
      const dir = path.join(__dirname, `${filename}`)
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
          successMsg: `Initialized!`
        })
      }, true)
    }
  })
}
