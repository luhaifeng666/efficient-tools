#! /usr/bin/env node

/**
 * @Description: A tool for image compression
 * @Author: luhaifeng
 * @Date: 2022/5/23
 */

const dotenv = require('dotenv')
const tinify = require('tinify')
const path = require('path')
const { readdir, mkdir } = require('fs/promises')
const { version } = require('../package.json')
const { program } = require('../src/utils/programInit')
const { promptCreator } = require('../src/utils/etl')
const { successHandler, errorHandler, handleDotenv, handleDotenvCheck, notEmpty, promisify } = require('../src/utils/common')

// dotenv configuration
const dotenvPath = path.join(__dirname, '../.env')
dotenv.config({ path: dotenvPath })

// exts
const IMAGE_SUPPORT_EXTS = [
  '.webp', '.jpeg', '.jpg', '.png'
]

// PWD
const BASE_URL = process.env.PWD

program.version(version, '-v, --version')

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
      })
    })
    if (children) {
      await compressHandler(dirname, children, `${originBaseUrl}/${dir}`)
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
        }
      ], answer => {
        // process accroding to selection
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
                  const baseUrl = path.resolve(pathname, `../`)
                  await mkdir(`${baseUrl}/${dName}`)
                  // compress images
                  await compressHandler(`${baseUrl}/${dName}`, images, baseUrl)
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
