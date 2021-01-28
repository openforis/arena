import fs from 'fs'
import path from 'path'

export const removeFiles = async ({ downloadPath }) => {
  if (fs.existsSync(path.join(downloadPath, 'extracted'))) {
    fs.rmdirSync(path.join(downloadPath, 'extracted'), { recursive: true })
  }

  await expect(fs.existsSync(path.join(downloadPath, 'extracted'))).not.toBeTruthy()
}
