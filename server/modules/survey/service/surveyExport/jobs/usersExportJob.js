import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as PromiseUtils from '@core/promiseUtils'

import Job from '@server/job/job'
import * as UserService from '@server/modules/user/service/userService'
import * as FileUtils from '@server/utils/file/fileUtils'

export default class UsersExportJob extends Job {
  constructor(params) {
    super('UsersExportJob', params)
  }

  async execute() {
    const { archive, surveyId, survey, user } = this.context

    const usersPathDir = 'users'
    const usersPathFile = FileUtils.join(usersPathDir, 'users.json')
    const usersProfilePicturePathDir = FileUtils.join(usersPathDir, 'profilepictures')

    const users = await UserService.fetchUsersBySurveyId(user, surveyId)
    archive.append(JSON.stringify(users, null, 2), { name: usersPathFile })

    this.total = users.length

    await PromiseUtils.each(users, async (_user) => {
      const userData = await UserService.fetchUserByUuidWithPassword(User.getUuid(_user))
      if (User.hasProfilePicture(userData)) {
        const userProfilePicture = await UserService.fetchUserProfilePicture(User.getUuid(userData))
        archive.append(userProfilePicture, {
          name: FileUtils.join(usersProfilePicturePathDir, `${User.getUuid(userData)}`), // the file is stored in binary
        })
      }
      this.incrementProcessedItems()
    })

    const userInvitationsPathFile = FileUtils.join(usersPathDir, 'userInvitations.json')
    const userInvitations = await UserService.fetchUserInvitationsBySurveyUuid({ surveyUuid: Survey.getUuid(survey) })
    archive.append(JSON.stringify(userInvitations, null, 2), { name: userInvitationsPathFile })
  }
}
