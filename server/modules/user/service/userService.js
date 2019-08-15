const aws = require('../../../system/aws')

const UserManager = require('../manager/userManager')
const AuthManager = require('../../auth/manager/authManager')

const User = require('../../../../common/user/user')
const AuthGroups = require('../../../../common/auth/authGroups')
const Authorizer = require('../../../../common/auth/authorizer')

const SystemError = require('../../../utils/systemError')
const UnauthorizedError = require('../../../utils/unauthorizedError')

const fetchUsersBySurveyId = async (user, surveyId, offset, limit) => {
  const fetchSystemAdmins = Authorizer.isSystemAdmin(user)

  return await UserManager.fetchUsersBySurveyId(surveyId, offset, limit, fetchSystemAdmins)
}

const inviteUser = async (user, surveyId, email, groupUuid) => {
  if (!Authorizer.isSystemAdmin(user)) {
    const group = await AuthManager.fetchGroupByUuid(groupUuid)

    if (AuthGroups.isSystemAdminGroup(group))
      throw new UnauthorizedError(User.getName(user))
  }

  const dbUser = await UserManager.fetchUserByEmail(email)
  if (dbUser) {
    const newUserGroups = User.getAuthGroups(dbUser)
    const hasRoleInSurvey = newUserGroups.some(g => AuthGroups.getSurveyId(g) === surveyId)

    if (hasRoleInSurvey) {
      throw new SystemError('userHasRole')
    } else if (Authorizer.isSystemAdmin(dbUser)) {
      throw new SystemError('userIsAdmin')
    } else {
      await UserManager.addUserToGroup(user, surveyId, groupUuid, dbUser)
    }
  } else {
    const { User: { Username: userUuid } } = await aws.inviteUser(email)
    await UserManager.insertUser(user, surveyId, userUuid, email, groupUuid)
  }
}

const updateUser = async (user, surveyId, userUuid, name, newGroupUuid) => {
  const newGroup = await AuthManager.fetchGroupByUuid(newGroupUuid)

  if (AuthGroups.isSystemAdminGroup(newGroup) && !Authorizer.isSystemAdmin(user)) {
    throw new UnauthorizedError(User.getName(user))
  }

  await UserManager.updateUser(user, surveyId, userUuid, name, newGroup)
}

const updateUsername = async (user, userUuid, name) => {
  // For now a user can change only his own name
  if (User.getUuid(user) !== userUuid) {
    throw new UnauthorizedError(User.getName(user))
  }

  await UserManager.updateUsername(user, name)
}

module.exports = {
  countUsersBySurveyId: UserManager.countUsersBySurveyId,

  fetchUsersBySurveyId,

  fetchUserByUuid: UserManager.fetchUserByUuid,

  updateUser,

  updateUsername,

  updateUserPref: UserManager.updateUserPref,

  deleteUserPref: UserManager.deleteUserPref,

  inviteUser,
}