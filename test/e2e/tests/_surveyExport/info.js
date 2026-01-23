import { ExportFile } from '../../../../server/modules/survey/service/surveyExport/exportFile'
import { getSurveyEntry } from '../../paths'

export const verifyInfo = (survey) =>
  test(`Verify info file ${survey.name}`, async () => {
    const infoEntry = getSurveyEntry(survey, ExportFile.info)
    expect(infoEntry.appInfo).toBeDefined()
    expect(infoEntry.dateExported).toBeDefined()
    expect(infoEntry.exportedByUserUuid).toBeDefined()
    expect(infoEntry.survey).toBeDefined()
    expect(infoEntry.survey.name).toBe(survey.name)
  })
