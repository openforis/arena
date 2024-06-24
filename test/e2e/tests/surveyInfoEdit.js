import { TestId, getSelector } from '../../../webapp/utils/testId'
import { gotoHome, gotoSurveyInfo } from './_navigation'
import { FormUtils } from './utils/formUtils'

const surveyName = FormUtils.getInputSelector(TestId.surveyInfo.surveyName)
const surveyLabel = FormUtils.getInputSelector(TestId.surveyInfo.surveyLabel())
const surveyDescription = FormUtils.getTextAreaSelector(TestId.surveyInfo.surveyDescription())
const surveyLanguage = getSelector(TestId.surveyInfo.surveyLanguage, 'input')
const saveBtn = getSelector(TestId.surveyInfo.saveBtn, 'button')

export default () =>
  describe('Survey info edit', () => {
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
