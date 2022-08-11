#! /usr/bin/env node

/**
 * @Description: A tool for image compression
 * @Author: luhaifeng
 * @Date: 2022/5/23
 */

import tinify from 'tinify'
import path from 'path'
import { fileURLToPath } from 'url'
import { readdir, mkdir } from 'fs/promises'
import { program } from '../src/utils/programInit.js'
import { promptCreator } from '../src/utils/etl.js'
import { dotenvInit } from '../src/utils/dotenvConfig.js'
import { successHandler, errorHandler, handleDotenv, handleDotenvCheck, notEmpty, promisify } from '../src/utils/common.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// dotenv configuration
const dotenvPath = path.join(__dirname, '../.env')
dotenvInit()

// exts
const IMAGE_SUPPORT_EXTS = [
  '.webp', '.jpeg', '.jpg', '.png'
]

// PWD
const BASE_URL = process.env.PWD

program
  .option('-s, --set', 'set your API key')
  .option('-c, --compress', 'image compression')

program.parse(process.argv)

const { set, compress } = program.opts()

// init tinify key
function init (key = process.env.TINIFY_API_KEY ) {
  tinify.key = key
}

// get all images' name
async function getAllImagesName (isDeep, dir = BASE_URL) {
  const res = {}
  try {
    const { name } = path.parse(dir)
    const hiddenFileRule = /(^|\/)\.[^\/\.]/g
    const files = (await readdir(dir)).filter(file => !hiddenFileRule.test(file))
    if (files.length) {
      res[name] = {
        imageNames: files.filter(file => IMAGE_SUPPORT_EXTS.includes(path.extname(`${dir}/${file}`).toLowerCase()))
      }
      if (isDeep) {
        const dirs = files.filter(file => !path.extname(`${dir}/${file}`))
        if (dirs.length) {
          const handlers = dirs.map(dirname => getAllImagesName(isDeep, `${dir}/${dirname}`))
          const data = await Promise.allSettled(handlers)
          res[name].children = data.reduce((obj, { value }) => ({...obj, ...value}), {})
        }
      }
    }
  } catch (e) {
    errorHandler(e.message)
  }
  return res
}

// compress handler
async function compressHandler(baseUrl, images, originBaseUrl) {
  const dirs = Object.keys(images)
  await Promise.allSettled(dirs.map(dir => mkdir(`${baseUrl}/${dir}`)))
  dirs.forEach(async dir => {
    const { imageNames, children } = images[dir]
    const dirname =`${baseUrl}/${dir}`

    imageNames.forEach(name => {
      const imagePath = `${originBaseUrl}/${dir}/${name}`
      promisify((resolve, reject) => {
        const source = tinify.fromFile(imagePath)
        resolve(source.toFile(`${dirname}/${name}`))
      }).then(() => {
        successHandler(`${imagePath} compression completed!`);
      }).catch(e => {
        errorHandler(e.message)
      })
    })
    if (children) {
      compressHandler(dirname, children, `${originBaseUrl}/${dir}`)
    }
  })
}

// initialization
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
        },
        {
          type: 'input',
          name: 'target',
          message: 'Please type the output file path:',
          default: path.resolve(BASE_URL, '..')
        }
      ], answer => {
        const { target } = answer
        // processording to selection
        switch (answer.type) {
          case 'local-images':
            promptCreator([
              {
                type: 'confirm',
                name: 'isDeep',
                message: 'Shallow or depth(default shallow)?',
                default: false
              },
              {
                type: 'input',
                name: 'pathname',
                message: 'Please type the target directory name(absolute path):',
                default: BASE_URL
              },
              {
                type: 'input',
                name: 'dName',
                message: 'Please type the directory name used to store compressed images:',
                default: new Date().getTime()
              }
            ], async answer => {
              try {
                const { isDeep, dName, pathname } = answer
                const images = await getAllImagesName(isDeep, pathname)
                if (Object.keys(images).length) {
                  // create a new directory to store compressed images
                  const targetDir = `${target}/${dName}`
                  const message = `* Compression start! The output file path is ${targetDir} *`
                  const startLine = new Array(message.length).fill('*').join('')
                  await mkdir(targetDir)
                  successHandler(startLine)
                  successHandler(message)
                  successHandler(startLine)
                  // compress images
                  compressHandler(targetDir, images, path.resolve(target, '..'))
                }
              } catch (e) {
                errorHandler(e)
              }
            })
            break
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
                resolve(source.toFile(`${target}/${imageName}`))
              }).then(() => {
                successHandler(`Compression completed! The compressed image is in ${target}.`);
              }).catch(e => {
                errorHandler(e.message)
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
