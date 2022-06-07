import { ExportFile } from '../../../../server/modules/survey/service/surveyExport/exportFile'
import { getSurveyEntry } from '../../paths'
import { getProps } from './_surveyUtils'

export const verifySurvey = (survey) =>
  test(`Verify survey ${survey.name}`, async () => {
    const surveyEntry = getSurveyEntry(survey, ExportFile.survey)
    const props = getProps(surveyEntry)
    await expect(props.name).toBe(survey.name)
    await expect(props.descriptions).toStrictEqual(survey.descriptions || {})
    await expect(props.labels).toStrictEqual(survey.labels || {})
    await expect(props.languages).toStrictEqual(survey.languages || [])
  })
