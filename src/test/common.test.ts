#!/usr/bin/env zx

/*
 * @Author: luhaifeng666 youzui@hotmail.com
 * @Date: 2022-08-11 10:38:38
 * @LastEditors: luhaifeng666
 * @LastEditTime: 2022-08-11 17:49:54
 * @Description: 
 */

import 'zx/globals'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  __dirname,
  notEmpty,
  promisify,
  isObject,
  errorHandler,
  warningHandler,
  successHandler
} from '../utils/common.js'

interface IsObject {
  [key: string]: {
    value: any
    res: boolean
  }
}

let originConsoleLog: any
let originConsoleError: any
let originConsoleWarn: any


describe('common.js', () => {
  beforeEach(() => {
    // store origin console function
    originConsoleLog = global.console.log
    originConsoleError = global.console.error
    originConsoleWarn = global.console.warn
  
    // overwrite console
    global.console.log = vi.fn()
    global.console.error = vi.fn()
    global.console.warn = vi.fn()
  })

  it('check __dirname', () => {
    // __dirname should contain '/efficient-tools/src/utils' path
    expect(__dirname).is.includes('/efficient-tools/src/utils')
  })

  it('error handler', () => {
    const message = 'This is an error message.'
    errorHandler(message)
    expect(global.console.error).toBeCalledTimes(1)
  })

  it('warning handler', () => {
    const message = 'This is a warning message.'
    warningHandler(message)
    expect(global.console.warn).toBeCalledTimes(1)
  })

  it('success handler', () => {
    const message = 'This is a success message.'
    successHandler(message)
    expect(global.console.log).toBeCalledTimes(1)
  })

  it('not empty', () => {
    const msg = 'Error!'
    const handler = notEmpty(msg)
    const errorRes = handler('')
    const successRes = handler('this is the answer')
    expect(errorRes).eq(msg)
    expect(successRes).toBe(true)
  })

  it('promisify', async () => {
    const res = await promisify((resolve, reject) => {
      resolve(true)
    })
    expect(res).toBe(true)
  })

  it('isObject', () => {
    // only values of the form '{}' are objects
    const targets:IsObject = {
      _null: { value: null, res: false },
      _undefined: { value: undefined, res: false },
      _string: { value: 'string', res: false },
      _number: { value: 1, res: false },
      _function: { value: () => {}, res: false },
      _object: { value: {}, res: true },
      _array: { value: [], res: false },
      _symbol: { value: Symbol(1), res: false },
      _bigint: { value: BigInt(1), res: false }
    }
    const res = Object.keys(targets).every(key => isObject(targets[key].value) === targets[key].res)
    expect(res).is.true
  })
  
  afterEach(() => {
    // recover the console function
    global.console.log = originConsoleLog
    global.console.error = originConsoleError
    global.console.warn = originConsoleWarn
  })
})

