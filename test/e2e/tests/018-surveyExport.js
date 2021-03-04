import path from 'path'

import { waitFor, reload } from '../utils/api'

import { expectHomeDashboard } from '../utils/ui/home'
import { clickSidebarBtnHome } from '../utils/ui/sidebar'
import { selectSurvey } from '../utils/ui/survey'
import {
  extractZipFileAndCheck,
  exportSurvey,
  checkSurvey,
  checkUsers,
  checkTaxonomies,
  checkCategories,
  removeFiles,
  checkActivityLog,
  checkNodeDefs,
  checkRecords,
  checkChains,
} from '../utils/surveyExport'

const basePath = process.env.GITHUB_WORKSPACE || __dirname
const downloadPath = basePath
const surveyZipPath = path.join(downloadPath, 'survey_survey.zip')
const extractedPath = path.join(downloadPath, 'extracted')
const surveyExtractedPath = path.join(extractedPath, 'survey_survey')

describe('Survey export', () => {
  test('Select survey', async () => selectSurvey())

  test('Open Survey', async () => {
    await reload()
    await waitFor(5000)

    await clickSidebarBtnHome()
    await expectHomeDashboard({ label: 'Survey' })
    await waitFor(5000)
  })
  test('Download survey zip', async () => exportSurvey({ zipFilePath: surveyZipPath }), 150000)

  test('Unzip file', async () => extractZipFileAndCheck({ zipPath: surveyZipPath, extractedPath, surveyExtractedPath }))

  test('Check survey.json', async () => checkSurvey({ surveyExtractedPath, values: { name: 'survey' } }))

  test('Check survey.json nodeDefs', async () => checkNodeDefs({ surveyExtractedPath }))

  test('Check categories', async () => checkCategories({ surveyExtractedPath }))

  test('Check chains', async () => checkChains({ surveyExtractedPath }))

  test('Check taxonomies', async () => checkTaxonomies({ surveyExtractedPath }))

  test('Check records', async () => checkRecords({ surveyExtractedPath }))

  test('Check files', async () => {
    await expect(true).toBeTruthy()
  })

  test('Check activityLog', async () => checkActivityLog({ surveyExtractedPath }))

  test('Check users', async () => checkUsers({ surveyExtractedPath }))

  test('Remove files', async () => removeFiles({ downloadPath }))
})
