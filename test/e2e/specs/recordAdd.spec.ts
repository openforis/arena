import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { getCategoryItemLabel, getTaxon } from '../fixtures/seed/sampleRecordDisplay'
import { cluster, plot, tree } from '../fixtures/seed/sampleSurveyModel'
import { RecordForm } from '../helpers/recordForm'
import { Urls } from '../helpers/urls'

const c = cluster.children
const p = plot.children
const t = tree.children

const values = {
  cluster_id: '11',
  cluster_decimal: '123.45',
  cluster_boolean: 'false',
  cluster_region: getCategoryItemLabel('01'),
  cluster_province: getCategoryItemLabel('012'),
  cluster_coordinate: { x: '12.5', y: '41.8', srs: '4326' },
  cluster_time: '10:25',
  plot_id: '1',
  plot_text: 'This is a plot text',
  trees: [
    { tree_id: '1', tree_dec_1: '20.5', tree_dec_2: '30.25', tree_species: getTaxon('AFZ/QUA') },
    { tree_id: '2', tree_dec_1: '21.5', tree_dec_2: '31.25', tree_species: getTaxon('BOU/PET') },
  ],
}

test.describe('Record add', () => {
  test('enters a new record through the record editor', async ({ page, sampleSurvey: _ }) => {
    const form = new RecordForm(page)

    await page.goto(Urls.records)
    await page.getByTestId(TestId.records.addBtn).click()
    await expect(page.getByTestId(TestId.surveyForm.surveyForm)).toBeVisible()
    // new record is invalid: the key attribute is empty
    await expect(page.getByTestId(TestId.record.invalidBtn)).toBeVisible()

    // default values
    await form.verify(c.cluster_country, getCategoryItemLabel('0'))
    await form.verify(c.cluster_boolean, 'true')

    await form.enter(c.cluster_id, values.cluster_id)
    await form.enter(c.cluster_decimal, values.cluster_decimal)
    await form.enter(c.cluster_boolean, values.cluster_boolean)
    await form.enter(c.cluster_region, values.cluster_region)
    await form.enter(c.cluster_province, values.cluster_province)
    await form.enter(c.cluster_coordinate, values.cluster_coordinate)
    await form.enter(c.cluster_time, values.cluster_time)

    await form.gotoPage(plot.name)
    await form.addFormEntity()
    await form.expectError(p.plot_id.name, 'Required value')
    await form.enter(p.plot_id, values.plot_id)
    await form.enter(p.plot_text, values.plot_text)

    for (const [idx, treeValues] of values.trees.entries()) {
      await form.addTableEntity(tree.name)
      const row = form.treeRow(tree.name, idx)
      await expect(row).toBeVisible()
      await form.expectError(t.tree_id.name, 'Required value', row)
      // default value of tree_species
      await form.verify(t.tree_species, getTaxon('ALB/GLA'), row)

      await form.enter(t.tree_id, treeValues.tree_id, row)
      await form.enter(t.tree_dec_1, treeValues.tree_dec_1, row)
      await form.enter(t.tree_dec_2, treeValues.tree_dec_2, row)
      await form.enter(t.tree_species, treeValues.tree_species, row)
    }

    await expect(page.getByTestId(TestId.record.invalidBtn)).toHaveCount(0)

    // reopen the record from the records list and verify the values have been stored
    await page.goto(Urls.records)
    await page
      .locator(`[data-testid="${TestId.records.cellNodeDef(c.cluster_id.name)}"][data-value="${values.cluster_id}"]`)
      .dblclick()
    await expect(page.getByTestId(TestId.surveyForm.surveyForm)).toBeVisible()

    await form.verify(c.cluster_id, values.cluster_id)
    await form.verify(c.cluster_decimal, values.cluster_decimal)
    await form.verify(c.cluster_boolean, values.cluster_boolean)
    await form.verify(c.cluster_country, getCategoryItemLabel('0'))
    await form.verify(c.cluster_region, values.cluster_region)
    await form.verify(c.cluster_province, values.cluster_province)
    await form.verify(c.cluster_coordinate, values.cluster_coordinate)
    await form.verify(c.cluster_time, values.cluster_time)

    await form.gotoPage(plot.name)
    await form.selectEntity(p.plot_id.label, values.plot_id)
    await form.verify(p.plot_id, values.plot_id)
    await form.verify(p.plot_text, values.plot_text)
    for (const [idx, treeValues] of values.trees.entries()) {
      const row = form.treeRow(tree.name, idx)
      for (const def of Object.values(t)) {
        await form.verify(def, treeValues[def.name as keyof typeof treeValues], row)
      }
    }
  })
})
