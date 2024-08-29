import fs from 'fs'
import path from 'path'

import { TestId, getSelector } from '../../../webapp/utils/testId'
import { downloadsPath } from '../paths'
import { gotoFormDesigner } from './_navigation'
import { cluster } from '../mock/nodeDefs'
import { parseCsvAsync } from '../../utils/csvUtils'

const getTestNodeDefs = () => {
  const items = []

  const stack = [{ parentPath: null, nodeDef: cluster }]
  while (stack.length) {
    const nodeDefItem = stack.shift()
    const { nodeDef, parentPath } = nodeDefItem
    const nodeDefPath = parentPath ? `${parentPath}.${nodeDef.name}` : nodeDef.name

    items.push({ nodeDef, path: nodeDefPath })

    if ('children' in nodeDef) {
      stack.push(
        ...Object.values(nodeDef.children).map((nodeDefChild) => ({
          parentPath: nodeDefPath,
          nodeDef: nodeDefChild,
        }))
      )
    }
  }
  return items
}

export default () =>
  describe('Survey Schema Summary', () => {
    gotoFormDesigner()

    const filePath = path.join(downloadsPath, 'schemaSummary.csv')
    let data = null

    test('export schema summary', async () => {
      const [download] = await Promise.all([
        page.waitForEvent('download'),

        page.click(getSelector(TestId.surveyForm.advancedFunctionBtn, 'button')),

        page.click(getSelector(TestId.surveyForm.schemaSummary, 'button')),
      ])

      await download.saveAs(filePath)

      await expect(fs.existsSync(filePath)).toBeTruthy()
    })

    const nodeDefs = getTestNodeDefs()

    test(`Check generated schema summary`, async () => {
      await expect(fs.existsSync(filePath)).toBeTruthy()

      data = await parseCsvAsync(filePath)

      await expect(data.length).toBe(nodeDefs.length)
    })

    nodeDefs.forEach((nodeDefItem, index) => {
      const { nodeDef, path: nodeDefPath } = nodeDefItem
      test(`Check ${nodeDef.name} def`, async () => {
        await expect(data).toBeDefined()
        const nodeDefData = data[index]
        await expect(Object.keys(nodeDefData)).toEqual([
          'uuid',
          'name',
          'path',
          'parentEntity',
          'label_en',
          'label_fr',
          'type',
          'key',
          'categoryName',
          'parentCode',
          'enumerator',
          'taxonomyName',
          'multiple',
          'readOnly',
          'fileType',
          'maxFileSize',
          'hiddenInForm',
          'hiddenInMobile',
          'includedInMultipleEntitySummary',
          'allowOnlyDeviceCoordinate',
          'relevantIf',
          'hiddenWhenNotRelevant',
          'itemsFilter',
          'defaultValue',
          'defaultValueApplyIf',
          'defaultValueEvaluateOnce',
          'required',
          'unique',
          'minCount',
          'maxCount',
          'validations',
          'cycle',
        ])
        await expect(nodeDefData.uuid).toBeDefined()
        await expect(nodeDefData.path).toBe(nodeDefPath)
        await expect(nodeDefData.type).toBe(nodeDef.type)
        await expect(nodeDefData.label_en).toBe(nodeDef.label)
        await expect(nodeDefData.key).toBe(String(Boolean(nodeDef.key)))
      })
    })
  })
