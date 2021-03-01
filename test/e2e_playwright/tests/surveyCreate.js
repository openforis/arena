import { DataTestId, getSelector } from '../../../webapp/utils/dataTestId'
import { gotoSurveyCreate, gotoSurveyList } from './_navigation'
import { survey, survey2 } from '../mock/survey'

const expectSurveyLabel = async (label) =>
  expect(await page.innerText(getSelector(DataTestId.dashboard.surveyLabel, 'h3'))).toBe(label.toUpperCase())

const createSurvey = (surveyToAdd, idx) => {
  gotoSurveyCreate()

  test(`Create Survey ${idx}`, async () => {
    await page.fill(getSelector(DataTestId.surveyCreate.surveyName, 'input'), surveyToAdd.name)
    await page.fill(getSelector(DataTestId.surveyCreate.surveyLabel, 'input'), surveyToAdd.label)

    await Promise.all([
      page.waitForNavigation(/* { url: 'http://localhost:9090/app/home/dashboard/' } */),
      page.click(getSelector(DataTestId.surveyCreate.submitBtn, 'button')),
    ])

    await expectSurveyLabel(surveyToAdd.label)
  })
}

export default () =>
  describe('Survey Create', () => {
    createSurvey(survey, 1)

    createSurvey(survey2, 2)

    gotoSurveyList()

    test('Select Survey 1', async () => {
      await Promise.all([
        page.waitForNavigation(/* { url: 'http://localhost:9090/app/home/dashboard/' } */),
        page.click(getSelector(DataTestId.surveyList.surveyRow(1))),
      ])

      await expectSurveyLabel(survey.label)
    })
  })
