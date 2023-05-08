import { expect, test } from '@playwright/test'

import { TestId, getSelector } from '../../../webapp/utils/testId'

import { categories } from '../mock/categories'
import { cluster } from '../mock/nodeDefs'
import { addItems, addLevels, editCategoryProps, exportCategory } from './_categoryDetails'
import { addNodeDef } from './_formDesigner'
import { gotoFormDesigner } from './_navigation'
import { editNodeDefDetails } from './_nodeDefDetails'
import { publishWithoutErrors } from './_publish'

// eslint-disable-next-line camelcase
const { cluster_country, cluster_region, cluster_province } = cluster.children
const category = categories[cluster_country.category]

export default () =>
  test.describe('NodeDefCode and category edit', () => {
    gotoFormDesigner()

    addNodeDef(cluster, cluster_country, false)

    test(`Add category ${category.label}`, async () => {
      const [response] = await Promise.all([
        page.waitForResponse('**/categories'),
        page.waitForResponse('**/categories/**'),
        page.waitForResponse('**/categories/**/items**'),
        page.click(getSelector(TestId.categorySelector.addCategoryBtn, 'button')),
      ])
      const json = await response.json()
      const categoryUuid = json.category.uuid
      await expect(categoryUuid).not.toBeNull()
      category.uuid = categoryUuid
    })

    editCategoryProps(category)

    addLevels(category)

    addItems(category, 0)

    exportCategory(category)

    test('Close category editor', async () => {
      await page.click(getSelector(TestId.panelRight.closeBtn, 'button'))
      await expect(page).toHaveText('Parent Code')
    })

    editNodeDefDetails(cluster_country)
    addNodeDef(cluster, cluster_region)
    addNodeDef(cluster, cluster_province)

    publishWithoutErrors()
  })
