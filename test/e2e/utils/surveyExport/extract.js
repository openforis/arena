import fs from 'fs'

// TODFIX
import { extractZip } from '@server/utils/file/fileZip'

export const extractZipFileAndCheck = async ({ zipPath, extractedPath, surveyExtractedPath }) => {
  await extractZip(zipPath, extractedPath)
  await expect(fs.existsSync(extractedPath)).toBeTruthy()
  await expect(fs.existsSync(surveyExtractedPath)).toBeTruthy()
}
