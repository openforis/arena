const aws = require('../../../system/aws')

const UserManager = require('../manager/userManager')
const AuthManager = require('../../auth/manager/authManager')

const UserValidator = require('../../../../common/user/userValidator')
const User = require('../../../../common/user/user')
const AuthGroups = require('../../../../common/auth/authGroups')
const Authorizer = require('../../../../common/auth/authorizer')

const SystemError = require('../../../utils/systemError')
const UnauthorizedError = require('../../../utils/unauthorizedError')

const inviteUser = async (user, surveyId, email, groupUuid) => {
  if (!Authorizer.isSystemAdmin(user)) {
    const group = await AuthManager.fetchGroupByUuid(groupUuid)
    if (AuthGroups.isAdminGroup(group))
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

const updateUsername = (user, userUuid, name) => {
  // For now a user can change only his own name
  if (User.getUuid(user) !== userUuid) {
    throw new UnauthorizedError(User.getName(user))
  }

  UserManager.updateUsername(user, name)
}

module.exports = {
  validateNewUser: UserValidator.validateNewUser,

  countUsersBySurveyId: UserManager.countUsersBySurveyId,

  fetchUsersBySurveyId: UserManager.fetchUsersBySurveyId,

  fetchUserByUuid: UserManager.fetchUserByUuid,

  updateUsername,

  updateUserPref: UserManager.updateUserPref,

  deleteUserPref: UserManager.deleteUserPref,

  inviteUser,
}