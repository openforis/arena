import Job from '@server/job/job'
import * as AuthGroup from '@core/auth/authGroup'
import * as User from '@core/user/user'
import { UserInvitation } from '@core/user/userInvitation'
import * as Survey from '@core/survey/survey'

import * as UserManager from '@server/modules/user/manager/userManager'
import * as AuthGroupRepository from '@server/modules/auth/repository/authGroupRepository'
import * as UserInvitationsRepository from '@server/modules/user/repository/userInvitationRepository'

import * as ArenaSurveyFileZip from '../model/arenaSurveyFileZip'

const _associateToGroup = async ({ userUuid, groupName }, client) => {
  const group = await AuthGroupRepository.fetchGroupByName({ name: groupName }, client)
  await AuthGroupRepository.insertUserGroup(AuthGroup.getUuid(group), userUuid, client)
}

/**
 * Inserts a new user and associate it to the user group of the specified survey.
 * It returns the newly inserted user or an already existing one, if it has the same uuid or email.
 */
const insertUser = async ({ user, surveyId, survey, arenaSurvey, arenaSurveyFileZip }, client) => {
  let userAlreadyExisting = false
  try {
    userAlreadyExisting = await UserManager.fetchUserByUuid(User.getUuid(user), client)
  } catch (e) {
    userAlreadyExisting = false
  }

  if (!userAlreadyExisting) {
    userAlreadyExisting = await UserManager.fetchUserByEmail(User.getEmail(user), client)
  }

  if (User.isSystemAdmin(userAlreadyExisting)) {
    // user already existing and he's a system admin, don't do anything else
    return userAlreadyExisting
  }

  const userUuid = userAlreadyExisting ? User.getUuid(userAlreadyExisting) : User.getUuid(user)

  if (!userAlreadyExisting) {
    // insert user
    const profilePicture = await ArenaSurveyFileZip.getUserProfilePicture(arenaSurveyFileZip, userUuid)

    await UserManager.importNewUser(
      {
        surveyId,
        uuid: userUuid,
        email: User.getEmail(user),
        password: User.getPassword(user),
        status: User.getStatus(user),
        title: User.getTitle(user),
        name: User.getName(user),
        profilePicture,
      },
      client
    )
  }

  // associate user to auth group(s)

  if (User.isSystemAdmin(user)) {
    // user to insert is system admin but not yet inserted
    await _associateToGroup({ userUuid, groupName: AuthGroup.groupNames.systemAdmin }, client)
  } else {
    if (User.isSurveyManager(user) && !(userAlreadyExisting && User.isSurveyManager(userAlreadyExisting))) {
      // user to insert is survey manager (but relation with group not existing yet)
      await _associateToGroup({ userUuid, groupName: AuthGroup.groupNames.surveyManager }, client)
    }
    // associate to survey auth group
    const authGroups = Survey.getAuthGroups(Survey.getSurveyInfo(survey))

    const arenaSurveyUuid = Survey.getUuid(Survey.getSurveyInfo(arenaSurvey))

    const userGroupImportedSurvey = User.getAuthGroupBySurveyUuid({
      surveyUuid: arenaSurveyUuid,
      defaultToMainGroup: true,
    })(user)

    const newGroup = authGroups.find((group) => AuthGroup.getName(group) === AuthGroup.getName(userGroupImportedSurvey))
    if (newGroup) {
      const surveyGroupUuid = AuthGroup.getUuid(newGroup)
      await AuthGroupRepository.insertUserGroup(surveyGroupUuid, userUuid, client)
    }
  }
  return userAlreadyExisting || user
}

const insertInvitations = async ({ survey, arenaSurveyFileZip, user, userUuidNewByUserUuid }, client) => {
  const userInvitations = await ArenaSurveyFileZip.getUserInvitations(arenaSurveyFileZip)
  if (userInvitations.length > 0) {
    // exclude invitations with user not in users list (user invited that never accepted the invitation)
    const userInvitationsValid = []
    userInvitations.forEach((userInvitation) => {
      const userUuidNew = userUuidNewByUserUuid[UserInvitation.getUserUuid(userInvitation)]
      if (userUuidNew) {
        const invitedBy = userUuidNewByUserUuid[UserInvitation.getInvitedBy(userInvitation)] || User.getUuid(user)
        userInvitationsValid.push({ ...userInvitation, userUuid: userUuidNew, invitedBy })
      }
    })
    if (userInvitationsValid.length > 0) {
      await UserInvitationsRepository.insertManyBatch({ survey, userInvitations: userInvitationsValid }, client)
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
    const { arenaSurveyFileZip, surveyId, arenaSurvey, survey, user } = this.context

    const users = await ArenaSurveyFileZip.getUsers(arenaSurveyFileZip)
    const includingUsers = users.length > 0

    if (this.user) {
      users.push(this.user)
    }

    const insertedUsers = await Promise.all(
      users.map(async (user) => insertUser({ user, surveyId, survey, arenaSurveyFileZip, arenaSurvey }, this.tx))
    )
    // map of user uuids in the db by user uuid in the zip file being imported (users could be already inserted in the db with a different uuid)
    const userUuidNewByUserUuid = users.reduce(
      (acc, user, index) => ({ ...acc, [User.getUuid(user)]: User.getUuid(insertedUsers[index]) }),
      {}
    )

    await insertInvitations({ survey, arenaSurveyFileZip, user, userUuidNewByUserUuid }, this.tx)

    this.setContext({ users, includingUsers, userUuidNewByUserUuid })
  }
}
