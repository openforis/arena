import fs from 'node:fs'
import path from 'node:path'

import AdmZip from 'adm-zip'

import { FileFormats } from '@core/fileFormats'
import { parseCsvAsync } from '@test/utils/csvUtils'
import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { getTaxon } from '../fixtures/seed/sampleRecordDisplay'
import { flattenCategoryItems, sampleRecords } from '../fixtures/seed/sampleSurveyModel'
import { Urls } from '../helpers/urls'

const categoryItemLabel = (code: string) => flattenCategoryItems().find((item) => item.code === code)!.label

test.describe('Data export', () => {
  test.use({ sampleSurveyOptions: { records: sampleRecords } })

  test('exports the records data in CSV format', async ({ page, sampleSurvey: _ }, testInfo) => {
    await page.goto(Urls.dataExport)
    await page.getByTestId(TestId.dataExport.fileFormatOption(FileFormats.csv)).click()
    await page.getByTestId(TestId.dataExport.startExport).click()

    const downloadBtn = page.getByTestId(TestId.dataExport.downloadExportedFileBtn)
    await expect(downloadBtn).toBeVisible({ timeout: 30_000 })
    const [download] = await Promise.all([page.waitForEvent('download'), downloadBtn.click()])

    const zipPath = testInfo.outputPath('data_export.zip')
    await download.saveAs(zipPath)
    const dirPath = testInfo.outputPath('data_export')
    new AdmZip(zipPath).extractAllTo(dirPath, true)

    const readCsv = async (fileName: string): Promise<Record<string, string>[]> => {
      const filePath = path.join(dirPath, fileName)
      expect(fs.existsSync(filePath), `${fileName} exported`).toBeTruthy()
      return (await parseCsvAsync(filePath)) as Record<string, string>[]
    }

    // cluster
    const clusterRows = await readCsv('01_cluster.csv')
    expect(clusterRows).toHaveLength(sampleRecords.length)
    for (const record of sampleRecords) {
      const row = clusterRows.find((_row) => _row.cluster_id === record.cluster_id)!
      expect(row, `cluster ${record.cluster_id} exported`).toBeTruthy()
      expect(Number(row.cluster_decimal)).toBe(Number(record.cluster_decimal))
      expect(row.cluster_date).toBe(record.cluster_date)
      expect(row.cluster_time).toBe(record.cluster_time)
      expect(row.cluster_boolean).toBe(record.cluster_boolean)
      for (const codeName of ['cluster_country', 'cluster_region', 'cluster_province'] as const) {
        expect(row[codeName]).toBe(record[codeName])
        expect(row[`${codeName}_label`]).toBe(categoryItemLabel(record[codeName]))
      }
    }

    // plot
    const plotRows = await readCsv('02_plot.csv')
    expect(plotRows).toHaveLength(sampleRecords.length)
    for (const record of sampleRecords) {
      const row = plotRows.find((_row) => _row.cluster_id === record.cluster_id)!
      expect(row.plot_id).toBe(record.plot_id)
      expect(row.plot_text).toBe(record.plot_text)
    }

    // tree
    const treeRows = await readCsv('03_tree.csv')
    expect(treeRows).toHaveLength(sampleRecords.flatMap((record) => record.trees).length)
    for (const record of sampleRecords) {
      for (const tree of record.trees) {
        const row = treeRows.find((_row) => _row.cluster_id === record.cluster_id && _row.tree_id === tree.tree_id)!
        expect(row, `tree ${record.cluster_id}/${tree.tree_id} exported`).toBeTruthy()
        expect(Number(row.tree_dec_1)).toBe(Number(tree.tree_dec_1))
        expect(Number(row.tree_dec_2)).toBe(Number(tree.tree_dec_2))
        expect(row.tree_species).toBe(tree.tree_species)
        expect(row.tree_species_scientific_name).toBe(getTaxon(tree.tree_species).scientificName)
      }
    }
  })
})
