const aws = require('../../../system/aws')

const db = require('../../../db/db')

const UserManager = require('../manager/userManager')

const UserRepository = require('../repository/userRepository')
const AuthGroupRepository = require('../../auth/repository/authGroupRepository')

const UserValidator = require('../../../../common/user/userValidator')
const User = require('../../../../common/user/user')
const AuthGroups = require('../../../../common/auth/authGroups')

const SystemError = require('../../../utils/systemError')

const inviteUser = async (surveyId, email, groupId, client = db) => {
  const user = await UserManager.fetchUserByEmail(email)

  if (user) {
    const userId = User.getId(user)
    const userGroups = User.getAuthGroups(user)
    const hasRoleInSurvey = userGroups.some(g => AuthGroups.getSurveyId(g) === surveyId)

    if (hasRoleInSurvey) {
      throw new SystemError('userHasRole')
    } else {
      await AuthGroupRepository.insertUserGroup(groupId, userId, client)
      return user
    }
  } else {
    return await client.tx(async t => {
      await aws.inviteUser(email)

      const newUser = await UserRepository.insertUser(surveyId, email, groupId, t)
      await AuthGroupRepository.insertUserGroup(groupId, User.getId(newUser), t)

      return newUser
    })
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