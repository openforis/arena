import { reload, waitFor } from '../utils/api'
import {
  closeJobMonitor,
  expectExistsJobMonitorSucceeded,
  expectExistsJobMonitorWithErrors,
} from '../utils/ui/jobMonitor'
import { waitForLoader } from '../utils/ui/loader'
import { clickSidebarBtnDesignerTaxonomies } from '../utils/ui/sidebar'
import {
  closeTaxonomyEditor,
  expectTaxonomyNameIs,
  expectTaxonomyDescriptionIs,
  expectTaxonomyTaxaEmpty,
  expectTaxonomyTaxaNotEmpty,
  expectTaxonomyTaxaTablePagination,
  selectTaxonomyFileToImport,
  writeTaxonomyDescription,
} from '../utils/ui/taxonomyDetails'
import { expectTaxonomyIsInvalid, editTaxonomy } from '../utils/ui/taxonomyList'

const taxonomyName = 'tree_species'

describe('Taxonomies: edit existing taxonomy', () => {
  test('TaxonomyList: navigate to taxonomy editor', async () => {
    await waitForLoader()
    await clickSidebarBtnDesignerTaxonomies()
    await expectTaxonomyIsInvalid({ taxonomyName })
    await editTaxonomy({ taxonomyName })
  })

  test('TaxonomyDetails: edit taxonomy', async () => {
    await writeTaxonomyDescription({ text: 'Tree Species List' })

    await selectTaxonomyFileToImport({ fileName: 'taxonomies/species list with errors.csv' })
    await waitFor(2000)

    await expectExistsJobMonitorWithErrors()
    await closeJobMonitor()

    await expectTaxonomyTaxaEmpty()
  })

  test('TaxonomiesList: check taxonomy list has errors', async () => {
    await reload()
    await waitFor(2000)
    await closeTaxonomyEditor()
    await expectTaxonomyIsInvalid({ taxonomyName })
  })

  test('TaxonomiesDetails: import taxa to existing taxonomy', async () => {
    await editTaxonomy({ taxonomyName })
    await expectTaxonomyNameIs({ name: taxonomyName })
    await expectTaxonomyDescriptionIs({ description: 'Tree Species List' })
    await expectTaxonomyTaxaEmpty()

    await selectTaxonomyFileToImport({ fileName: 'taxonomies/species list valid.csv' })
    await waitFor(2000)

    await expectExistsJobMonitorSucceeded()
    await closeJobMonitor()

    await expectTaxonomyTaxaNotEmpty()
    await expectTaxonomyTaxaTablePagination({ from: 1, to: 14, total: 14 })
    await closeTaxonomyEditor()
  })
})
