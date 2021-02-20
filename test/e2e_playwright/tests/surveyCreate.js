import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'
import { gotoSurveyCreate, gotoSurveyList } from './_navigation'

const expectSurveyLabel = async (label) =>
  expect(await page.innerText(getSelector(DataTestId.dashboard.surveyLabel, 'h3'))).toBe(label.toUpperCase())

const createSurvey = (name, label, idx) => {
  gotoSurveyCreate()

  test(`Create Survey ${idx}`, async () => {
    await page.fill(getSelector(DataTestId.surveyCreate.surveyName, 'input'), name)
    await page.fill(getSelector(DataTestId.surveyCreate.surveyLabel, 'input'), label)

    await Promise.all([
      page.waitForNavigation(/* { url: 'http://localhost:9090/app/home/dashboard/' } */),
      page.click(getSelector(DataTestId.surveyCreate.submitBtn, 'button')),
    ])

    await expectSurveyLabel(label)
  })
}

export default () =>
  describe('Survey Create', () => {
    createSurvey('survey', 'Survey', 1)

    createSurvey('survey_2', 'Survey 2', 2)

    gotoSurveyList()

    test('Select Survey 1', async () => {
      await Promise.all([
        page.waitForNavigation(/* { url: 'http://localhost:9090/app/home/dashboard/' } */),
        page.click(getSelector(DataTestId.surveyList.surveyRow(1))),
      ])

      await expectSurveyLabel('Survey')
    })
  })
