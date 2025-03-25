import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as PromiseUtils from '@core/promiseUtils'

import Job from '@server/job/job'
import * as UserService from '@server/modules/user/service/userService'
import { ExportFile } from '../exportFile'

export default class UsersExportJob extends Job {
  constructor(params) {
    super('UsersExportJob', params)
  }

  async execute() {
    const { archive, surveyId, survey } = this.context

    const users = await UserService.fetchUsersBySurveyId({ surveyId })
    archive.append(JSON.stringify(users, null, 2), { name: ExportFile.users })

    this.total = users.length

    await PromiseUtils.each(users, async (_user) => {
      const userUuid = User.getUuid(_user)
      const userData = await UserService.fetchUserByUuidWithPassword(userUuid)
      if (User.hasProfilePicture(userData)) {
        const userProfilePicture = await UserService.fetchUserProfilePicture(userUuid)
        archive.append(userProfilePicture, {
          name: ExportFile.userProfilePicture({ userUuid }), // the file is stored in binary
        })
      }
      this.incrementProcessedItems()
    })

    const userInvitations = await UserService.fetchUserInvitationsBySurveyUuid({ surveyUuid: Survey.getUuid(survey) })
    archive.append(JSON.stringify(userInvitations, null, 2), { name: ExportFile.userInvitations })
  }
}
