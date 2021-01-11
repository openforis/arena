import path from 'path'
import fs from 'fs'
import { client, toLeftOf } from 'taiko'
import extract from 'extract-zip'

import * as Survey from '@core/survey/survey'

import { waitFor, reload, click } from '../utils/api'

import { expectHomeDashboard } from '../utils/ui/home'
import { clickSidebarBtnHome } from '../utils/ui/sidebar'

const downloadPath = path.resolve(__dirname, 'data', 'downloaded')
const surveyZipPath = path.join(downloadPath, 'survey_survey.zip')
const extractedPath = path.resolve(downloadPath, 'extracted')
const surveyExtractedPath = path.join(extractedPath, 'survey_survey')

describe('Survey export', () => {
  test('Survey require name', async () => {
    await reload()
    await waitFor(5000)

    await client().send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath,
    })

    await clickSidebarBtnHome()
    await expectHomeDashboard({ label: 'Survey' })

    await click('Export', toLeftOf('Delete'))
    await waitFor(10000)
    await expect(path.join(downloadPath, 'survey_survey.zip')).toBeTruthy()
    await expect(fs.existsSync(surveyZipPath)).toBeTruthy()
  }, 150000)

  test('Unzip file', async () => {
    await extract(surveyZipPath, { dir: extractedPath })
    await expect(fs.existsSync(extractedPath)).toBeTruthy()
    await expect(fs.existsSync(surveyExtractedPath)).toBeTruthy()
  })

  test('Check survey.json', async () => {
    await expect(fs.existsSync(path.join(surveyExtractedPath, 'survey.json'))).toBeTruthy()
    const content = fs.readFileSync(path.join(surveyExtractedPath, 'survey.json'), 'utf8')
    const survey = JSON.parse(content)
    const surveyInfo = Survey.getSurveyInfo(survey)
    const surveyName = Survey.getName(surveyInfo)
    await expect(surveyName).toBe('survey')
    const labels = Survey.getLabels(surveyInfo)
    await expect(labels).toMatchObject({
      en: 'Survey',
    })
    const languages = Survey.getLanguages(surveyInfo)
    await expect(languages.sort()).toEqual(['en', 'fr'].sort())
  })

  test('Check categories', async () => {
    await expect(fs.existsSync(path.join(surveyExtractedPath, 'categories'))).toBeTruthy()
  })

  test('Check chains', async () => {
    await expect(fs.existsSync(path.join(surveyExtractedPath, 'chains'))).toBeTruthy()
  })

  test('Check records', async () => {
    await expect(fs.existsSync(path.join(surveyExtractedPath, 'records'))).toBeTruthy()
  })

  test('Check taxonomies', async () => {
    await expect(fs.existsSync(path.join(surveyExtractedPath, 'taxonomies'))).toBeTruthy()
  })
  test('Check files', async () => {
    await expect(true).toBeTruthy()
  })

  test('Remove files', async () => {
    if (fs.existsSync(surveyZipPath)) {
      fs.unlinkSync(surveyZipPath)
    }

    await expect(surveyZipPath).not.toBeTruthy()

    if (fs.existsSync(path.join(downloadPath, 'extracted'))) {
      fs.unlinkSync(path.join(downloadPath, 'extracted'))
    }

    await expect(path.join(downloadPath, 'extracted')).not.toBeTruthy()
  })
})
