import fs from 'fs'
import path from 'path'

import { DataTestId } from '../../../webapp/utils/dataTestId'
import { downloadsPath } from '../paths'
import { gotoFormDesigner } from './_navigation'

export default () =>
  describe('Survey Schema Summary', () => {
    gotoFormDesigner()

    test('export schema summary', async () => {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.waitForResponse(/.+\/schema-summary\?.*/),
        page.click(DataTestId.surveyForm.schemaSummary),
      ])

      const filePath = path.join(downloadsPath, 'schemaSummary.csv')
      await download.saveAs(filePath)

      await expect(fs.existsSync(filePath)).toBeTruthy()
    })
  })
