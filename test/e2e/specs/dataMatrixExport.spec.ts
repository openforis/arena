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

  test('exports species in rows and records in columns', async ({ page, sampleSurvey: _ }, testInfo) => {
    await page.goto(Urls.records)
    await page.getByRole('button', { name: 'Export', exact: true }).click()
    await page.getByRole('button', { name: 'Export data matrix' }).click()

    const modal = page.locator('.records-data-matrix-export')
    await selectDropdownItem({
      page,
      dropdown: getDropdown(modal, TestId.entities.entitySelector),
      label: 'Tree',
    })
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
