import fs from 'fs'

import { downloadsPath } from '../paths'

export const removeDowloadsFolder = () => {
  test(`Remove downloads folder`, async () => {
    fs.rmdirSync(downloadsPath, { recursive: true })
    await expect(fs.existsSync(downloadsPath)).toBeFalsy()
  })
}
