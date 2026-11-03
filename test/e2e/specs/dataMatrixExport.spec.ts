import { FileFormats } from '@core/fileFormats'
import { parseCsvAsync } from '@test/utils/csvUtils'
import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { getTaxon } from '../fixtures/seed/sampleRecordDisplay'
import { sampleRecords } from '../fixtures/seed/sampleSurveyModel'
import { getDropdown, selectDropdownItem } from '../helpers/dropdown'
import { Urls } from '../helpers/urls'

test.describe('Data matrix export', () => {
  test.use({ sampleSurveyOptions: { records: sampleRecords } })

  test('exports species in rows and records in columns from Data Explorer', async ({
    page,
    sampleSurvey: _,
  }, testInfo) => {
    await page.goto(Urls.dataExplorer)
    await selectDropdownItem({ page, dropdown: getDropdown(page, TestId.entities.entitySelector), label: 'Tree' })
    await page.locator('.attribute-selector', { hasText: 'Tree Species' }).click()
    await page.getByRole('button', { name: 'Export', exact: true }).click()

    const modal = page.locator('.data-query-export-modal')
    await modal.getByTestId(TestId.dataExport.exportLayoutOption('dataMatrix')).click()
    await selectDropdownItem({
      page,
      dropdown: getDropdown(modal, TestId.dataExport.dataMatrixRowAttribute),
      label: 'Tree Species',
    })
    await selectDropdownItem({
      page,
      dropdown: getDropdown(modal, TestId.dataExport.dataMatrixValueAttribute),
      label: 'Tree id',
    })
    // the preview shows the structure of the exported table
    await expect(modal.locator('.data-matrix-export__preview th').first()).toHaveText('Tree Species')
    await modal.getByTestId(TestId.dataExport.fileFormatOption(FileFormats.csv)).click()
    await modal.getByTestId(TestId.dataExport.startExport).click()

    const downloadBtn = page.getByTestId(TestId.dataExport.downloadExportedFileBtn)
    await expect(downloadBtn).toBeVisible({ timeout: 30_000 })
    const [download] = await Promise.all([page.waitForEvent('download'), downloadBtn.click()])
    const filePath = testInfo.outputPath('data_matrix.csv')
    await download.saveAs(filePath)

    const rows = (await parseCsvAsync(filePath)) as Record<string, string>[]
    const trees = sampleRecords.flatMap((record) =>
      record.trees.map((tree) => ({ clusterId: record.cluster_id, ...tree }))
    )
    const scientificNames = new Set(trees.map((tree) => getTaxon(tree.tree_species).scientificName))
    expect(rows).toHaveLength(scientificNames.size)

    for (const { clusterId, tree_id: treeId, tree_species: species } of trees) {
      const row = rows.find((_row) => _row.tree_species_scientific_name === getTaxon(species).scientificName)!
      expect(row[clusterId].split('; '), `tree ${clusterId}/${treeId} exported`).toContain(treeId)
    }
  })
})
