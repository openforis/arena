const aws = require('../../../system/aws')

const UserManager = require('../manager/userManager')

const AuthManager = require('../../auth/manager/authManager')

const UserValidator = require('../../../../common/user/userValidator')
const User = require('../../../../common/user/user')
const AuthGroups = require('../../../../common/auth/authGroups')

const SystemError = require('../../../utils/systemError')

const inviteUser = async (user, surveyId, email, groupId) => {
  const dbUser = await UserManager.fetchUserByEmail(email)

  if (dbUser) {
    const newUserId = User.getId(dbUser)
    const newUserGroups = User.getAuthGroups(dbUser)
    const hasRoleInSurvey = newUserGroups.some(g => AuthGroups.getSurveyId(g) === surveyId)

    if (hasRoleInSurvey) {
      throw new SystemError('userHasRole')
    } else {
      await AuthManager.addUserToGroup(user, surveyId, groupId, newUserId)
      return dbUser
    }
  } else {
    const newUser = await UserManager.insertUser(user, surveyId, email, groupId)
    await aws.inviteUser(email)

    return newUser
  }
}

module.exports = {
  validateNewUser: UserValidator.validateNewUser,

  countUsersBySurveyId: UserManager.countUsersBySurveyId,

  fetchUsersBySurveyId: UserManager.fetchUsersBySurveyId,

  findUserById: UserManager.findUserById,

  fetchUserByCognitoUsername: UserManager.fetchUserByCognitoUsername,

  updateUserPref: UserManager.updateUserPref,

  deleteUserPref: UserManager.deleteUserPref,

  inviteUser,
}