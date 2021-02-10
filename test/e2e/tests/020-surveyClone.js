import path from 'path'

import { button, click, expectExists, getElement, reload, waitFor, writeIntoTextBox, within } from '../utils/api'
import {
  extractZipFileAndCheck,
  exportSurvey,
  checkSurvey,
  checkUsers,
  checkTaxonomies,
  checkCategories,
  checkNodeDefs,
  checkRecordsEmpty,
  removeFiles,
  checkChains,
} from '../utils/surveyExport'
import { expectHomeDashboard } from '../utils/ui/home'
import { closeJobMonitor } from '../utils/ui/jobMonitor'
import { clickHeaderBtnCreateSurvey } from '../utils/ui/header'
import { deleteSurvey } from '../utils/ui/deleteSurvey'
import { waitForLoader } from '../utils/ui/loader'

const basePath = process.env.GITHUB_WORKSPACE || __dirname
const downloadPath = basePath
let surveyZipPath = ''
let extractedPath = ''
let surveyExtractedPath = ''
let surveyName = null

// ${name}-import-yyyy-MM-dd_hh-mm-ss

const cloneSurvey = async ({ name, label, cloneFrom }) => {
  await writeIntoTextBox({ text: name, selector: { placeholder: 'Name' } })
  await writeIntoTextBox({ text: label, selector: { placeholder: 'Label' } })

  await writeIntoTextBox({ text: cloneFrom, selector: { placeholder: 'Clone from' } })

  await click('survey', within(await getElement({ selector: '.autocomplete-list' })))
  await click(button('Create Survey'))
  await waitForLoader()
}

const cloneAndVerifySurvey = async ({ name, label, cloneFrom }) => {
  await clickHeaderBtnCreateSurvey()
  await cloneSurvey({ name, label, cloneFrom })
  await expectHomeDashboard({ label })
}

describe('Survey clone', () => {
  test('Clone survey', async () => {
    await reload()
    await waitFor(5000)
    await cloneAndVerifySurvey({ name: 'clone', label: 'Cloned', cloneFrom: 'survey' })

    await waitFor(5000)

    await closeJobMonitor()

    await expectHomeDashboard({ label: 'Cloned' })

    await waitFor(5000)

    const headerSurveyTitle = await getElement({ selector: '.header__survey-title' })
    const headerSurveyTitleValue = await headerSurveyTitle.text()

    const [_surveyName, surveyLabel] = headerSurveyTitleValue.split(' - ')
    surveyName = _surveyName

    await expect(surveyLabel).toBe('Cloned')
    await expect(surveyName).toBe('clone')

    await expectExists({ text: 'CLONE' })

    surveyZipPath = path.join(downloadPath, `survey_${surveyName}.zip`)
    extractedPath = path.join(downloadPath, 'extracted')
    surveyExtractedPath = path.join(extractedPath, `survey_${surveyName}`)
  }, 60000)

  test('Export survey cloned', async () => exportSurvey({ zipFilePath: surveyZipPath }))

  test('Unzip file', async () => extractZipFileAndCheck({ zipPath: surveyZipPath, extractedPath, surveyExtractedPath }))

  test('Check survey.json', async () =>
    checkSurvey({ surveyExtractedPath, values: { name: surveyName, languages: ['en', 'fr'], info: { en: 'Cloned' } } }))

  test('Check users in cloned survey', async () =>
    checkUsers({ surveyExtractedPath, numberOfUsers: 1, expectedUsers: ['test@arena.com'] }))

  test('Check taxonomies', async () => checkTaxonomies({ surveyExtractedPath }))

  test('Check categories', async () => checkCategories({ surveyExtractedPath }))

  test('Check survey.json nodeDefs', async () => checkNodeDefs({ surveyExtractedPath }))

  test('Check records', async () => checkRecordsEmpty({ surveyExtractedPath }))

  test('Check chains', async () => checkChains({ surveyExtractedPath }))

  test('Remove files', async () => removeFiles({ downloadPath }))

  test('delete a survey with name "clone" and label "Cloned"', async () => {
    await deleteSurvey({ name: surveyName, label: 'Cloned', needsToFind: false })
  })
})
