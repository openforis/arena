import { getSurveyEntry } from '../../downloads/path'

export const verifySurvey = (survey) =>
  test(`Verify survey ${survey.name}`, async () => {
    const { info } = getSurveyEntry(survey, 'survey.json')
    await expect(info.props.name).toBe(survey.name)
    await expect(info.props.descriptions).toStrictEqual(survey.descriptions)
    await expect(info.props.labels).toStrictEqual(survey.labels)
    await expect(info.props.languages).toStrictEqual(survey.languages)
  })
