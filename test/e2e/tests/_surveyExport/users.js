import { getSurveyEntry } from '../../paths'
import { ExportFile } from '../../../../server/modules/survey/service/surveyExport/exportFile'

export const verifyUsers = (survey) =>
  test(`Verify users`, async () => {
    const usersExport = getSurveyEntry(survey, ExportFile.users)

    // admin user not included in exported users
    await expect(usersExport.length).toBe(0)
  })
