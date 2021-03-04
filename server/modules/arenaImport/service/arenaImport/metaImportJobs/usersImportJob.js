import Job from '@server/job/job'
import * as AuthGroup from '@core/auth/authGroup'
import * as User from '@core/user/user'
import * as Survey from '@core/survey/survey'

import * as UserManager from '@server/modules/user/manager/userManager'
import * as AuthGroupRepository from '@server/modules/auth/repository/authGroupRepository'
import * as UserRepository from '@server/modules/user/repository/userRepository'

import * as ArenaSurveyFileZip from '../model/arenaSurveyFileZip'

const insertUser = async ({ user, surveyId, survey, arenaSurvey, currentUser, arenaSurveyFileZip }, client) => {
  let _user = false
  try {
    _user = await UserManager.fetchUserByUuid(User.getUuid(user), client)
  } catch (e) {
    _user = false
  }

  if (!_user) {
    _user = await UserManager.fetchUserByEmail(User.getEmail(user), client)
  }

  const arenaSurveyUuid = Survey.getUuid(Survey.getSurveyInfo(arenaSurvey))

  if (User.isSystemAdmin(_user)) {
    return
  }

  const authGroups = Survey.getAuthGroups(Survey.getSurveyInfo(survey))

  const userGroupImportedSurvey = User.getAuthGroupBySurveyUuid(arenaSurveyUuid, true)(user)

  const newGroup = authGroups.find((group) => AuthGroup.getName(group) === AuthGroup.getName(userGroupImportedSurvey))

  if (!newGroup) return
  const newGroupUuid = AuthGroup.getUuid(newGroup)

  if (_user) {
    await AuthGroupRepository.insertUserGroup(newGroupUuid, User.getUuid(_user), client)
  } else {
    const userCreated = await UserManager.importNewUser(
      {
        surveyId,
        uuid: User.getUuid(user),
        email: User.getEmail(user),
        password: User.getPassword(user),
        status: User.getStatus(user),
        groupUuid: newGroupUuid,
        title: User.getTitle(user),
        user: currentUser,
        name: User.getName(user),
      },
      client
    )

    const profilePicture = await ArenaSurveyFileZip.getUserProfilePicture(arenaSurveyFileZip, User.getUuid(user))

    if (profilePicture) {
      await UserRepository.updateUser(
        {
          userUuid: User.getUuid(user),
          profilePicture,
          name: User.getName(user),
          email: User.getEmail(user),
        },
        client
      )
    }
    await AuthGroupRepository.insertUserGroup(newGroupUuid, User.getUuid(userCreated), client)
  }
}

/**
 * Inserts a taxonomy for each taxonomy
 * Saves the list of inserted taxonomies in the "taxonomies" context property.
 */
export default class UsersImportJob extends Job {
  constructor(params) {
    super('UsersImportJob', params)
  }

  async execute() {
    const { arenaSurveyFileZip, surveyId, arenaSurvey, survey } = this.context

    const users = await ArenaSurveyFileZip.getUsers(arenaSurveyFileZip)

    users.push(this.user)

    await Promise.all(
      users.map(async (user) =>
        insertUser(
          {
            user,
            surveyId,
            survey,
            arenaSurveyFileZip,
            arenaSurvey,
          },
          this.tx
        )
      )
    )

    this.setContext({ users })
  }
}
