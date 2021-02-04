import Job from '@server/job/job'
import * as AuthGroup from '@core/auth/authGroup'
import * as User from '@core/user/user'
import * as Survey from '@core/survey/survey'

import * as UserManager from '@server/modules/user/manager/userManager'
import * as AuthGroupManager from '@server/modules/auth/manager/authManager'
import * as AuthGroupRepository from '@server/modules/auth/repository/authGroupRepository'

import * as ArenaSurveyFileZip from '../model/arenaSurveyFileZip'

const insertUser = async ({ user, surveyId, survey, arenaSurvey, currentUser }, client) => {
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

  if (_user) {
    if (User.isSystemAdmin(_user)) {
      return
    }

    const authGroups = await AuthGroupManager.fetchSurveyGroups(surveyId, client)

    const userGroupImportedSurvey = User.getAuthGroupBySurveyUuid(arenaSurveyUuid, true)(user)

    const newGroup = authGroups.find((group) => AuthGroup.getName(group) === AuthGroup.getName(userGroupImportedSurvey))

    if (newGroup) {
      const newGroupUuid = AuthGroup.getUuid(newGroup)
      await AuthGroupRepository.insertUserGroup(newGroupUuid, User.getUuid(_user), client)
    }
  } else {
    const newSurveyGroups = Survey.getAuthGroups(Survey.getSurveyInfo(survey))

    const newGroup = newSurveyGroups.find(
      (group) =>
        AuthGroup.getName(group) === AuthGroup.getName(User.getAuthGroupBySurveyUuid(arenaSurveyUuid, true)(user))
    )

    if (newGroup) {
      await UserManager.importNewUser(
        {
          surveyId,
          uuid: User.getUuid(user),
          email: User.getEmail(user),
          password: User.getPassword(user),
          status: User.getStatus(user),
          groupUuid: AuthGroup.getUuid(newGroup),
          title: User.getTitle(user),
          user: currentUser,
        },
        client
      )

    }
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

    const usersList = await ArenaSurveyFileZip.getUsers(arenaSurveyFileZip)

    const users = await Promise.all(
      (usersList || []).map(async (user) => ArenaSurveyFileZip.getUser(arenaSurveyFileZip, User.getUuid(user)))
    )

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
