import { parseCsvAsync } from '@test/utils/csvUtils'
import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { cluster, plot, SampleNodeDef, tree } from '../fixtures/seed/sampleSurveyModel'
import { Urls } from '../helpers/urls'

type EntityModel = { name: string; label: string; type: string; children: Record<string, SampleNodeDef> }

/**
 * Returns the expected schema summary items (node def and path) of the sample survey.
 * @returns {Array} - Node defs with their path.
 */
const getExpectedItems = () => {
  const items: { name: string; label: string; type: string; key: boolean; path: string }[] = []
  const addEntity = (entity: EntityModel, parentPath: string | null) => {
    const entityPath = parentPath ? `${parentPath}.${entity.name}` : entity.name
    items.push({ name: entity.name, label: entity.label, type: 'entity', key: false, path: entityPath })
    Object.values(entity.children).forEach((child) =>
      items.push({ ...child, key: Boolean(child.key), path: `${entityPath}.${child.name}` })
    )
    return entityPath
  }
  const clusterPath = addEntity(cluster, null)
  const plotPath = addEntity(plot, clusterPath)
  addEntity(tree, plotPath)
  return items
}

test.describe('Survey schema summary', () => {
  test('exports the schema summary as CSV', async ({ page, sampleSurvey: _ }, testInfo) => {
    await page.goto(Urls.formDesigner)
    await expect(page.getByTestId(TestId.surveyForm.surveyForm)).toBeVisible()

    await page.getByTestId(TestId.surveyForm.advancedFunctionBtn).click()
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId(TestId.surveyForm.schemaSummary).click(),
    ])
    const filePath = testInfo.outputPath('schemaSummary.csv')
    await download.saveAs(filePath)

    const rows = (await parseCsvAsync(filePath)) as Record<string, string>[]
    const expectedItems = getExpectedItems()
    expect(rows).toHaveLength(expectedItems.length)

    expect(Object.keys(rows[0])).toEqual(
      expect.arrayContaining(['uuid', 'name', 'path', 'parentEntity', 'label_en', 'type', 'key', 'required', 'unique'])
    )
    for (const expected of expectedItems) {
      const row = rows.find((_row) => _row.name === expected.name)!
      expect(row, `${expected.name} in schema summary`).toBeTruthy()
      expect(row.uuid).toBeTruthy()
      expect(row.path).toBe(expected.path)
      expect(row.type).toBe(expected.type)
      expect(row.label_en).toBe(expected.label)
      expect(row.key).toBe(String(expected.key))
    }
  })
})
