import { expect, test } from '@playwright/test'

import { TestId, getSelector } from '../../../webapp/utils/testId'
import { gotoHome, gotoSurveyInfo } from './_navigation'

const surveyName = getSelector(TestId.surveyInfo.surveyName, 'input')
const surveyLabel = getSelector(TestId.surveyInfo.surveyLabel(), 'input')
const surveyDescription = getSelector(TestId.surveyInfo.surveyDescription(), 'textarea')
const surveyLanguage = getSelector(TestId.surveyInfo.surveyLanguage, 'input')
const saveBtn = getSelector(TestId.surveyInfo.saveBtn, 'button')

export default () =>
  test.describe('Survey info edit', () => {
    gotoSurveyInfo()

    test('Verify name required', async () => {
      await page.fill(surveyName, '')
      await page.click(saveBtn)
      // wait for validation feedback
      await page.waitForTimeout(1000)

      await page.hover(surveyName)
      await expect(page).toHaveText('Name is required')
    })

    test('Edit survey info', async () => {
      await page.fill(surveyName, 'survey')
      await page.fill(surveyLabel, 'My Survey')
      await page.fill(surveyDescription, 'This is a survey description')
      await page.fill(surveyLanguage, 'fr')
      await page.click(getSelector(TestId.dropdown.dropDownItem('fr')))

      await page.click(saveBtn)
    })

    gotoHome()
    gotoSurveyInfo()

    test('Verify survey info', async () => {
      await expect(await page.inputValue(surveyName)).toBe('survey')
      await expect(await page.inputValue(surveyLabel)).toBe('My Survey')
      await expect(await page.inputValue(surveyDescription)).toBe('This is a survey description')
      await expect(page).toHaveText('English')
      await expect(page).toHaveText('French')
    })
  })
