const aws = require('../../../system/aws')

const UserManager = require('../manager/userManager')

const AuthGroupManager = require('../../auth/manager/authManager')

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
      await AuthGroupManager.insertUserGroup(user, surveyId, groupId, newUserId)
      return dbUser
    }
  } else {
    const { User: { Username: cognitoUsername } } = await aws.inviteUser(email)
    const newUser = await UserManager.insertUser(user, surveyId, cognitoUsername, email, groupId)

    return newUser
  }
}

module.exports = {
  validateNewUser: UserValidator.validateNewUser,

  countUsersBySurveyId: UserManager.countUsersBySurveyId,

  fetchUsersBySurveyId: UserManager.fetchUsersBySurveyId,

  findUserById: UserManager.findUserById,

  fetchUserByCognitoUsername: UserManager.fetchUserByCognitoUsername,

  updateUsername: UserManager.updateUsername,

  updateUserPref: UserManager.updateUserPref,

  deleteUserPref: UserManager.deleteUserPref,

  inviteUser,
}