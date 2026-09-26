import { ExportFile } from '@server/modules/survey/service/surveyExport/exportFile'
import { TestId } from '@webapp/utils/testId'

import { expect, test } from '../fixtures'
import { sampleRecords } from '../fixtures/seed/sampleSurveyModel'
import {
  exportSurvey,
  verifySampleCategories,
  verifySampleNodeDefs,
  verifySampleRecords,
  verifySampleTaxonomies,
  verifySurveyInfo,
} from '../helpers/surveyExport'
import { Urls } from '../helpers/urls'

test.describe('Survey export and import', () => {
  // export and import jobs
  test.slow()

  test.use({ sampleSurveyOptions: { records: sampleRecords } })

  test('exports a survey with its data', async ({ page, sampleSurvey }, testInfo) => {
    const surveyExport = await exportSurvey(page, testInfo)

    verifySurveyInfo(surveyExport, { name: sampleSurvey.name })
    verifySampleNodeDefs(surveyExport)
    verifySampleCategories(surveyExport)
    verifySampleTaxonomies(surveyExport)
    verifySampleRecords(surveyExport, sampleRecords)

    // the exporting user (system admin) is not included in the survey users
    expect(surveyExport.entry(ExportFile.users)).toHaveLength(0)

    const info = surveyExport.entry(ExportFile.info)
    expect(info.appInfo).toBeDefined()
    expect(info.dateExported).toBeDefined()
    expect(info.exportedByUserUuid).toBeDefined()
    expect(info.survey.name).toBe(sampleSurvey.name)
  })

  test('imports an exported survey with its data', async ({ page, sampleSurvey, api }, testInfo) => {
    const surveyExport = await exportSurvey(page, testInfo)

    await page.goto(Urls.surveyNew)
    await page.getByTestId(TestId.surveyCreate.createTypeBtn({ prefix: 'surveyCreateType', type: 'import' })).click()
    await page.getByTestId(TestId.surveyCreate.optionIncludeDataCheckbox).click()
    await page.locator('.home-survey-create .dropzone input').setInputFiles(surveyExport.zipPath)
    await page.getByTestId(TestId.surveyCreate.startImportBtn).click()

    const jobModal = page.getByTestId(TestId.modal.modal)
    await jobModal.getByRole('button', { name: 'Close' }).click({ timeout: 60_000 })

    // the imported survey gets a new unique name and becomes the current survey
    const surveyTitle = page.getByTestId(TestId.header.surveyTitle)
    await expect(surveyTitle).not.toContainText(`[${sampleSurvey.name}]`)
    const importedName = /\[(\w+)\]$/.exec((await surveyTitle.textContent())!.trim())![1]
    try {
      const importedExport = await exportSurvey(page, testInfo)
      verifySurveyInfo(importedExport, { name: importedName })
      verifySampleNodeDefs(importedExport)
      verifySampleCategories(importedExport)
      verifySampleTaxonomies(importedExport)
      verifySampleRecords(importedExport, sampleRecords)
    } finally {
      await api.deleteSurveyByNameIfExists({ name: importedName })
    }
  })
})
