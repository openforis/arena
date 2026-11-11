import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { getCategoryItemLabel, getTaxon } from '../fixtures/seed/sampleRecordDisplay'
import { cluster, plot, tree } from '../fixtures/seed/sampleSurveyModel'
import { RecordForm, today } from '../helpers/recordForm'
import { Urls } from '../helpers/urls'

const c = cluster.children
const p = plot.children
const t = tree.children

test.describe('Survey form preview', () => {
  test.use({ sampleSurveyOptions: { publish: false } })

  test.beforeEach(async ({ page, sampleSurvey: _ }) => {
    await page.goto(Urls.formDesigner)
    await page.getByTestId(TestId.surveyForm.previewOpenBtn).click()
    await expect(page.getByTestId(TestId.surveyForm.previewCloseBtn)).toBeVisible()
  })

  test('applies default values and relevancy', async ({ page }) => {
    const form = new RecordForm(page)

    await form.expectError(c.cluster_id.name, 'Required value')
    await form.verify(c.cluster_id, '')
    await form.verify(c.cluster_decimal, '')
    await form.verify(c.cluster_boolean, 'true')
    await form.verify(c.cluster_country, getCategoryItemLabel('0'))
    await form.verify(c.cluster_region, '')
    await form.verify(c.cluster_province, '')
    await form.verify(c.cluster_coordinate, { x: '', y: '', srs: '4326' })
    await form.verify(c.cluster_date, today())
    await form.verify(c.cluster_time, /^\d{2}:\d{2}$/)

    // plot is relevant only when cluster_id > 0
    await form.gotoPage(plot.name)
    await expect(form.nodeDefWrapper(plot.name)).toHaveClass(/not-applicable/)

    await form.gotoPage(cluster.name)
    await form.enter(c.cluster_id, '1')
    await form.gotoPage(plot.name)
    await expect(form.nodeDefWrapper(plot.name)).not.toHaveClass(/not-applicable/)
  })

  test('validates coordinates, entity keys and custom validation expressions', async ({ page }) => {
    const form = new RecordForm(page)

    await form.enter(c.cluster_id, '1')
    await form.enter(c.cluster_coordinate, { x: '342.432', y: '3424.231', srs: '4326' })
    await form.expectError(c.cluster_coordinate.name, 'Invalid value')

    await form.gotoPage(plot.name)
    await form.addFormEntity()
    await form.enter(p.plot_id, '1')

    const trees = [
      { tree_id: '1', tree_dec_1: '0', tree_dec_2: '8.543', tree_species: getTaxon('BOU/PET') },
      { tree_id: '1', tree_dec_1: '10.5432', tree_dec_2: '0', tree_species: getTaxon('ALB/ADI') },
    ]
    for (const [idx, treeValues] of trees.entries()) {
      await form.addTableEntity(tree.name)
      const row = form.treeRow(tree.name, idx)
      await form.enter(t.tree_id, treeValues.tree_id, row)
      await form.enter(t.tree_dec_1, treeValues.tree_dec_1, row)
      await form.enter(t.tree_dec_2, treeValues.tree_dec_2, row)
      await form.enter(t.tree_species, treeValues.tree_species, row)
    }
    const [tree1, tree2] = [form.treeRow(tree.name, 0), form.treeRow(tree.name, 1)]

    await form.expectError(t.tree_id.name, 'Duplicate entity key', tree1)
    await form.expectError(t.tree_id.name, 'Duplicate entity key', tree2)

    // tree_dec_1 > 0
    await form.expectError(t.tree_dec_1.name, 'tree_dec_1 > 0', tree1)
    await expect(form.errorBadge(t.tree_dec_1.name, tree2)).toHaveCount(0)

    // tree_dec_2 > 0 (applied only if tree_dec_1 > 10) and tree_dec_2 > 10
    await form.expectError(t.tree_dec_2.name, 'tree_dec_2 > 0', tree2)
    await form.expectError(t.tree_dec_2.name, 'tree_dec_2 > 10', tree1)
  })
})
