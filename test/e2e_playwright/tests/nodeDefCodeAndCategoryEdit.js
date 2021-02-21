import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'

import { categories } from '../mock/categories'
import { cluster } from '../mock/nodeDefs'
import { addItems, addLevels, editCategoryProps } from './_categoryDetails'
import { gotoFormDesigner } from './_navigation'
import { editNodeDefDetails } from './_nodeDefDetails'
import { addNodeDef } from './_surveyForm'

// eslint-disable-next-line camelcase
const { cluster_country, cluster_region, cluster_province } = cluster.children
const category = categories[cluster_country.category]

export default () =>
  describe('NodeDefCode and category edit', () => {
    gotoFormDesigner()

    addNodeDef(cluster, cluster_country, false)

    test(`Add category ${category.label}`, async () => {
      const [response] = await Promise.all([
        page.waitForResponse('**/categories'),
        page.click(getSelector(DataTestId.categorySelector.addCategoryBtn, 'button')),
      ])
      const json = await response.json()
      category.uuid = json.category.uuid
    })

    editCategoryProps(category)

    addLevels(category)

    addItems(category, 0)

    test('Close category editor', async () => {
      await page.click(getSelector(DataTestId.panelRight.closeBtn, 'button'))
      await expect(page).toHaveText('Parent Code')
    })

    editNodeDefDetails(cluster_country)
    addNodeDef(cluster, cluster_region)
    addNodeDef(cluster, cluster_province)
  })
