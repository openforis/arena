import { expect, test } from '@playwright/test'

import fs from 'fs'
import path from 'path'

import { downloadsPath } from '../paths'

export const cleanDowloadsFolder = () => {
  test(`Clean downloads folder`, async () => {
    const files = fs.readdirSync(downloadsPath)
    files.forEach((fileName) => {
      const filePath = path.join(downloadsPath, fileName)
      if (fs.statSync(filePath).isDirectory()) {
        fs.rmdirSync(filePath, { recursive: true })
      } else {
        fs.rmSync(filePath)
      }
    })
    expect(fs.readdirSync(downloadsPath).length).toBe(0)
  })
}
