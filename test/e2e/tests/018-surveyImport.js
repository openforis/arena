import path from 'path'

import { expectExists, fileSelect, getElement, reload, waitFor } from '../utils/api'
import {
  extractZipFileAndCheck,
  exportSurvey,
  checkSurvey,
  checkUsers,
  checkTaxonomies,
  checkCategories,
  checkNodeDefs,
  checkRecords,
} from '../utils/surveyExport'
import { expectHomeDashboard } from '../utils/ui/home'
import { closeJobMonitor, expectExistsJobMonitorSucceeded } from '../utils/ui/jobMonitor'
import { clickHeaderBtnCreateSurvey } from '../utils/ui/header'
import { deleteSurvey } from '../utils/ui/deleteSurvey'

const basePath = process.env.GITHUB_WORKSPACE || __dirname
const downloadPath = basePath
let surveyZipPath = ''
let extractedPath = ''
let surveyExtractedPath = ''
let surveyName = null
const fileZipName = 'survey_survey.zip'

// ${name}-import-yyyy-MM-dd_hh-mm-ss
const surveyTitleRegExp = new RegExp(
  /survey-import-([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])_\d{2}-\d{2}-\d{2}) - Survey/
)
describe('Survey import', () => {
  test('Upload survey zip', async () => {
    await reload()
    await waitFor(5000)

    await clickHeaderBtnCreateSurvey()
    await fileSelect({ inputFileId: 'import-from-arena', fileRoot: downloadPath, fileName: fileZipName })

    await waitFor(5000)

    await expectExistsJobMonitorSucceeded()
    await closeJobMonitor()

    await expectHomeDashboard({ label: 'Survey' })

    await waitFor(5000)

    const headerSurveyTitle = await getElement({ selector: '.header__survey-title' })
    const headerSurveyTitleValue = await headerSurveyTitle.text()

    const [_surveyName, surveyLabel] = headerSurveyTitleValue.split(' - ')
    surveyName = _surveyName

    await expect(surveyTitleRegExp.test(headerSurveyTitleValue)).toBe(true)
    await expect(surveyLabel).toBe('Survey')

    await expectExists({ text: 'SURVEY' })

    surveyZipPath = path.join(downloadPath, `survey_${surveyName}.zip`)
    extractedPath = path.join(downloadPath, 'extracted')
    surveyExtractedPath = path.join(extractedPath, `survey_${surveyName}`)
  }, 30000)

  test('Export survey imported', async () => exportSurvey({ zipFilePath: surveyZipPath }))

  test('Unzip file', async () => extractZipFileAndCheck({ zipPath: surveyZipPath, extractedPath, surveyExtractedPath }))

  test('Check survey.json', async () =>
    checkSurvey({ surveyExtractedPath, values: { name: surveyName, languages: ['en', 'fr'], info: { en: 'Survey' } } }))

  test('Check users in imported survey', async () => checkUsers({ surveyExtractedPath }))

  test('Check taxonomies', async () => checkTaxonomies({ surveyExtractedPath }))

  test('Check categories', async () => checkCategories({ surveyExtractedPath }))

  test('Check survey.json nodeDefs', async () => checkNodeDefs({ surveyExtractedPath }))

  test('Check records', async () => checkRecords({ surveyExtractedPath }))

  // test('Remove files', async () => removeFiles({ downloadPath }))

  test('delete a survey with name "survey" and label "Survey"', async () => {
    await deleteSurvey({ name: surveyName, label: 'Survey', needsToFind: false })
  })
})
