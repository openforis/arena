const { expectExists, toRightOf, click } = require('../utils/api')
const { closeJobMonitor, expectExistsJobMonitorWithErrors } = require('../utils/ui/jobMonitor')
const { waitForLoader } = require('../utils/ui/loader')
const { clickSidebarBtnDesignerTaxonomies } = require('../utils/ui/sidebar')
const {
  expectTaxonomyTaxaEmpty,
  selectTaxonomyFileToImport,
  writeTaxonomyDescription,
} = require('../utils/ui/taxonomyDetails')

const taxonomyName = 'tree_species'

describe('Taxonomies: edit existing taxonomy', () => {
  test('TaxonomyList: navigate to taxonomy editor', async () => {
    await waitForLoader()
    await clickSidebarBtnDesignerTaxonomies()
    // Expect ${taxonomyName} to be invalid
    await expectExists({ text: 'Invalid', relativeSelectors: [toRightOf(taxonomyName)] })

    // navigate to taxonomy editor
    await click('edit', toRightOf(taxonomyName))
    await expectExists({ selector: '.taxonomy' })
  })

  test('TaxonomyDetails: edit taxonomy', async () => {
    await writeTaxonomyDescription({ text: 'Tree Species List' })
    await selectTaxonomyFileToImport({
      fileName: 'taxonomies/species list with errors.csv',
    })
    await expectExistsJobMonitorWithErrors()
    await closeJobMonitor()
    await expectTaxonomyTaxaEmpty()
  })
})
