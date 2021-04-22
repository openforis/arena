import { getSurveyEntry } from '../../downloads/path'

export const verifySurvey = (survey) =>
  test(`Verify survey ${survey.name}`, async () => {
    const { info } = getSurveyEntry(survey, 'survey.json')
    const props = { ...info.props, ...info.propsDraft }
    await expect(props.name).toBe(survey.name)
    await expect(props.descriptions).toStrictEqual(survey.descriptions)
    await expect(props.labels).toStrictEqual(survey.labels)
    await expect(props.languages).toStrictEqual(survey.languages)
  })
