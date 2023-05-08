import { expect, test } from '@playwright/test'

import { TestId, getSelector } from '../../../webapp/utils/testId'
import { plot, tree } from '../mock/nodeDefs'
import { taxonomies } from '../mock/taxonomies'
import { addNodeDef, gotoFormPage } from './_formDesigner'
import { gotoFormDesigner } from './_navigation'
import { editNodeDefDetails } from './_nodeDefDetails'
import { publishWithoutErrors } from './_publish'
import { editTaxonomyDetails } from './_taxonomyDetails'

// eslint-disable-next-line camelcase
const { tree_species } = tree.children
const taxonomy = taxonomies[tree_species.taxonomy]

export default () =>
  test.describe('NodeDefTaxon and taxonomy edit', () => {
    gotoFormDesigner()
    gotoFormPage(plot)

    addNodeDef(tree, tree_species, false)

    test(`Add Taxonomy`, async () => {
      await Promise.all([
        page.waitForResponse('**/taxonomies'),
        page.waitForResponse('**/taxonomies/**'),
        page.waitForResponse('**/taxonomies/**/taxa**'),
        page.waitForResponse('**/taxonomies/**/taxa/count**'),
        page.click(getSelector(TestId.nodeDefDetails.taxonomySelectorAddBtn, 'button')),
      ])
    })

    editTaxonomyDetails(taxonomy)

    test('Close taxonomy editor', async () => {
      await page.click(getSelector(TestId.panelRight.closeBtn, 'button'))
      await expect(page).toHaveText('Taxonomy')
    })

    editNodeDefDetails(tree_species)

    publishWithoutErrors()
  })
