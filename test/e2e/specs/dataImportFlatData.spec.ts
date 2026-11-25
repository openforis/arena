import type { Page } from '@playwright/test'

import { FileFormats } from '@core/fileFormats'
import { fileFormats, FlatDataFileFormat, Rows, toFileContent } from '@test/utils/flatDataImportTestUtils'
import { TestId } from '@webapp/utils/testId'
import { expect, test } from '../fixtures'
import { sampleRecords } from '../fixtures/seed/sampleSurveyModel'
import { Urls } from '../helpers/urls'

const mimeTypeByFileFormat: Record<FlatDataFileFormat, string> = {
  [FileFormats.csv]: 'text/csv',
  [FileFormats.xlsx]: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

const jobTimeout = 30_000

const selectFile = async ({ page, fileFormat, rows }: { page: Page; fileFormat: FlatDataFileFormat; rows: Rows }) => {
  const content = await toFileContent({ fileFormat, rows })
  await page.locator('.dropzone input[type="file"]').setInputFiles({
    name: `data.${fileFormat}`,
    mimeType: mimeTypeByFileFormat[fileFormat],
    buffer: Buffer.from(content),
  })
}

const expectCompleteDialogAndClose = async ({ page, texts }: { page: Page; texts: string[] }) => {
  const dialog = page.locator('.data-import_complete-dialog')
  for (const text of texts) {
    await expect(dialog).toContainText(text, { timeout: jobTimeout })
  }
  await dialog.getByRole('button', { name: 'Ok' }).click()
  await expect(dialog).toBeHidden()
}

// validates the selected file (dry run), then imports it: both upload the file in chunks
const validateAndImport = async ({
  page,
  rowsCount,
  importSummary,
}: {
  page: Page
  rowsCount: number
  importSummary: string[]
}) => {
  await page.getByTestId(TestId.dataImport.validateFileBtn).click()
  await expectCompleteDialogAndClose({
    page,
    texts: ['Validation complete without errors', `${rowsCount} rows processed`],
  })

  await page.getByTestId(TestId.dataImport.startImportBtn).click()
  await page.getByTestId(TestId.modal.modal).getByRole('button', { name: 'Ok' }).click()
  await expectCompleteDialogAndClose({
    page,
    texts: ['Import complete', `${rowsCount} rows processed`, ...importSummary],
  })
}

test.describe('Data import from CSV/Excel', () => {
  test.use({ sampleSurveyOptions: { withExpressions: false, records: sampleRecords } })

  for (const fileFormat of fileFormats) {
    test(`inserts new records (${fileFormat})`, async ({ page, sampleSurvey: _ }) => {
      await page.goto(Urls.dataImport)
      // inserting new records: the root entity is selected automatically
      await page.getByRole('button', { name: 'Insert new records' }).click()
      await selectFile({
        page,
        fileFormat,
        rows: [
          ['cluster_id', 'cluster_decimal'],
          [10, 10.5],
          [11, 11.5],
        ],
      })
      await validateAndImport({ page, rowsCount: 2, importSummary: ['2 records created'] })
    })

    test(`updates existing records (${fileFormat})`, async ({ page, sampleSurvey: _ }) => {
      await page.goto(Urls.dataImport)
      await page.getByRole('button', { name: 'Update existing records' }).click()
      // the tree item contains its children: click its own label
      await page.getByTestId(TestId.surveyForm.pageLinkBtn('cluster')).locator('.MuiTreeItem-label').first().click()
      const [record1, record2] = sampleRecords
      await selectFile({
        page,
        fileFormat,
        rows: [
          ['cluster_id', 'cluster_decimal'],
          [Number(record1.cluster_id), 2000.5],
          [Number(record2.cluster_id), 2001.5],
        ],
      })
      await validateAndImport({ page, rowsCount: 2, importSummary: ['2 records updated', '2 values updated'] })
    })
  }
})
