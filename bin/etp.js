#! /usr/bin/env node

/**
 * @Description: A tool for image compression
 * @Author: luhaifeng
 * @Date: 2022/5/23
 */

const dotenv = require('dotenv')
const tinify = require('tinify')
const path = require('path')
const fs = require('fs')
const { version } = require('../package.json')
const { program } = require('../src/utils/programInit')
const { promptCreator } = require('../src/utils/etl')
const { successHandler, errorHandler, handleDotenv, handleDotenvCheck, notEmpty, promisify } = require('../src/utils/common')

const dotenvPath = path.join(__dirname, '../.tiny.env')
dotenv.config({ path: dotenvPath })

program.version(version, '-v, --version')

program
  .option('-s, --set', 'set your API key')
  .option('-c, --compress', 'image compression')
  .option('-a, --all', 'compress all images in the current directory')

program.parse(process.argv)

const { set, compress, all } = program.opts()

// init tinify key
function init (key = process.env.TINIFY_API_KEY ) {
  tinify.key = key
}

// get all images' name
function getAllImagesName () {

}

init()

// set API key
if (set) {
  promptCreator([
    {
      type: 'input',
      name: 'TINIFY_API_KEY',
      message: 'Please set your tinify apiKey'
    }
  ], answer => {
    handleDotenv(Object.keys(answer).reduce((obj, key) => ({
      ...obj,
      [key]: answer[key]
    }), {}), 'Config successfully!', dotenvPath)
    // set TINIFY_API_KEY
    init(answer.TINIFY_API_KEY)
  })
}

// compress images
if (compress) {
  handleDotenvCheck(['TINIFY_API_KEY'], res => {
    if (res) {
      promptCreator([
        {
          type: 'list',
          name: 'type',
          message: 'Do you wanna compress local images or online images?',
          choices: ['local-images', 'online-images'],
          default: 'local-images'
        }
      ], answer => {
        // process accroding to selection
        switch (answer.type) {
          case 'local-images':
            try {
              const source = tinify.fromFile("src")
              source.toFile("test.png")
            } catch (e) {
              errorHandler(e)
            }
          case 'online-images':
            promptCreator([
              {
                type: 'input',
                name: 'imageLink',
                message: 'Please type the image\'s link:',
                validate: notEmpty('The image\'s link can not be empty!')
              },
              {
                type: 'input',
                name: 'imageName',
                message: 'Please type the image\'s name:',
                default: new Date().getTime().toString()
              }
            ], answer => {
              const { imageLink, imageName } = answer
              successHandler('Compressing...');
              promisify((resolve, reject) => {
                const source = tinify.fromUrl(imageLink)
                resolve(source.toFile(imageName))
              }).then(() => {
                successHandler('Compression completed!');
              })
            })
            break
          default: break
        }
      })
    } else {
      errorHandler('The API key shouldn\'t be empty! Please config them first by "etp -s/--set" command.')
    }
  }, dotenvPath)
}
