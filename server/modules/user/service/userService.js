const aws = require('../../../system/aws')

const UserManager = require('../manager/userManager')
const AuthManager = require('../../auth/manager/authManager')

const UserValidator = require('../../../../common/user/userValidator')
const User = require('../../../../common/user/user')
const AuthGroups = require('../../../../common/auth/authGroups')
const Authorizer = require('../../../../common/auth/authorizer')

const SystemError = require('../../../utils/systemError')
const UnauthorizedError = require('../../../utils/unauthorizedError')

const inviteUser = async (user, surveyId, email, groupId) => {

  if (!Authorizer.isSystemAdmin(user)) {
    const group = await AuthManager.fetchGroupById(groupId)
    if (AuthGroups.isAdminGroup(group))
      throw new UnauthorizedError(User.getName(user))
  }

  const dbUser = await UserManager.fetchUserByEmail(email)
  if (dbUser) {
    const newUserGroups = User.getAuthGroups(dbUser)
    const hasRoleInSurvey = newUserGroups.some(g => AuthGroups.getSurveyId(g) === surveyId)

    if (hasRoleInSurvey) {
      throw new SystemError('userHasRole')
    } else {
      await UserManager.addUserToGroup(user, surveyId, groupId, dbUser)
    }
  } else {
    const { User: { Username: cognitoUsername } } = await aws.inviteUser(email)
    await UserManager.insertUser(user, surveyId, cognitoUsername, email, groupId)
  }
}

const updateUsername = (user, userUuid, name) => {
  // For now a user can change only his own name
  if (User.getCognitoUsername(user) !== userUuid) {
    throw new UnauthorizedError(User.getName(user))
  }

  UserManager.updateUsername(user, name)
}

module.exports = {
  validateNewUser: UserValidator.validateNewUser,

  countUsersBySurveyId: UserManager.countUsersBySurveyId,

  fetchUsersBySurveyId: UserManager.fetchUsersBySurveyId,

  findUserById: UserManager.findUserById,

  fetchUserByCognitoUsername: UserManager.fetchUserByCognitoUsername,

  updateUsername,

  updateUserPref: UserManager.updateUserPref,

  deleteUserPref: UserManager.deleteUserPref,

  inviteUser,
}