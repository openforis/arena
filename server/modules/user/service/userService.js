const aws = require('../../../system/aws')

const UserManager = require('../manager/userManager')
const AuthManager = require('../../auth/manager/authManager')
const SurveyManager = require('../../survey/manager/surveyManager')

const Survey = require('../../../../common/survey/survey')
const User = require('../../../../common/user/user')
const AuthGroups = require('../../../../common/auth/authGroups')
const Authorizer = require('../../../../common/auth/authorizer')

const SystemError = require('../../../utils/systemError')
const UnauthorizedError = require('../../../utils/unauthorizedError')

const fetchUsersBySurveyId = async (user, surveyId, offset, limit) => {
  const fetchSystemAdmins = Authorizer.isSystemAdmin(user)

  return await UserManager.fetchUsersBySurveyId(surveyId, offset, limit, fetchSystemAdmins)
}

const countUsersBySurveyId = async (user, surveyId) => {
  const countSystemAdmins = Authorizer.isSystemAdmin(user)

  return await UserManager.countUsersBySurveyId(surveyId, countSystemAdmins)
}

const inviteUser = async (user, surveyId, email, groupUuid) => {
  if (!Authorizer.isSystemAdmin(user)) {
    const group = await AuthManager.fetchGroupByUuid(groupUuid)

    if (AuthGroups.isSystemAdminGroup(group))
      throw new UnauthorizedError(User.getName(user))
  }

  const dbUser = await UserManager.fetchUserByEmail(email)
  if (dbUser) {
    const survey = await SurveyManager.fetchSurveyById(surveyId)
    const newUserGroups = User.getAuthGroups(dbUser)
    const hasRoleInSurvey = newUserGroups.some(g => AuthGroups.getSurveyUuid(g) === Survey.getUuid(Survey.getSurveyInfo(survey)))

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

const updateUser = async (user, surveyId, userUuid, name, email, groupUuid) => {
  const survey = await SurveyManager.fetchSurveyById(surveyId)
  const surveyInfo = Survey.getSurveyInfo(survey)
  const userToUpdate = await UserManager.fetchUserByUuid(userUuid)
  const groupUserToUpdate = Authorizer.getSurveyUserGroup(userToUpdate, surveyInfo)

  if (AuthGroups.getUuid(groupUserToUpdate) !== groupUuid) {
    if (!Authorizer.canEditUserGroup(user, surveyInfo, userToUpdate)) {
      throw new UnauthorizedError(User.getName(user))
    }
  }

  // Check if email has changed
  const oldEmail = User.getEmail(userToUpdate)
  if (oldEmail !== email) {
    const canEditEmail = Authorizer.canEditUserEmail(user, Survey.getSurveyInfo(survey), userToUpdate)

    // Throw exception if user is not allowed
    if (!canEditEmail) {
      throw new UnauthorizedError(User.getName(user))
    }

    // Send aws a email update request if changed
    await aws.updateEmail(oldEmail, email)
  }

  return await UserManager.updateUser(user, surveyId, userUuid, name, email, groupUuid)
}

const updateUsername = async (user, userUuid, name) => {
  // For now a user can change only his own name
  if (User.getUuid(user) !== userUuid) {
    throw new UnauthorizedError(User.getName(user))
  }

  await UserManager.updateUsername(user, name)
}

module.exports = {
  countUsersBySurveyId,

  fetchUsersBySurveyId,

  fetchUserByUuid: UserManager.fetchUserByUuid,

  fetchUserProfilePicture: UserManager.fetchUserProfilePicture,

  updateUser,

  updateUsername,

  updateUserPref: UserManager.updateUserPref,

  deleteUserPref: UserManager.deleteUserPref,

  inviteUser,
}