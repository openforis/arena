import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'
import { plot, tree } from '../mock/nodeDefs'
import { taxonomies } from '../mock/taxonomies'
import { editNodeDefDetails } from './_nodeDefDetails'
import { addNodeDef, gotoFormPage } from './_surveyForm'
import { editTaxonomyDetails } from './_taxonomyDetails'

// eslint-disable-next-line camelcase
const { tree_species } = tree.children
const taxonomy = taxonomies[tree_species.taxonomy]

export default () =>
  describe('NodeDefTaxon and taxonomy edit', () => {
    gotoFormPage(plot)

    addNodeDef(tree, tree_species, false)

    test(`Add Taxonomy`, async () => {
      await page.click(getSelector(DataTestId.nodeDefDetails.taxonomySelectorAddBtn, 'button'))
    })

    editTaxonomyDetails(taxonomy)

    test('Close taxonomy editor', async () => {
      await page.click(getSelector(DataTestId.panelRight.closeBtn, 'button'))
      await expect(page).toHaveText('Taxonomy')
    })

    editNodeDefDetails(tree_species)
  })
