/*
 * @Author: luhaifeng666 youzui@hotmail.com
 * @Date: 2022-08-11 10:33:47
 * @LastEditors: luhaifeng666
 * @LastEditTime: 2022-08-11 15:58:32
 * @Description: 
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      reporter: ['html', 'text', 'json']
    }
  }
})