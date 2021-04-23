import { getSurveyEntry } from '../../downloads/path'
import { user } from '../../mock/user'
import { ExportFile } from '../../../../server/modules/survey/service/surveyExport/exportFile'

export const verifyUsers = (survey) =>
  test(`Verify users`, async () => {
    const usersExport = getSurveyEntry(survey, ExportFile.users)
    const users = [user]

    await expect(usersExport.length).toBe(users.length)

    await Promise.all(
      usersExport.map(async (userExport) => {
        const userMock = users.find((_user) => _user.email === userExport.email)
        await expect(userMock).toBeTruthy()
        await expect(userExport.status).toBe('ACCEPTED')
        await expect(userExport.authGroups.length).toBe(1)
        await expect(userExport.authGroups[0].name).toBe(userMock.authGroup.key)
      })
    )
  })
