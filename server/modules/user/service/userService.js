const fs = require('fs')

const passwordGenerator = require('generate-password')

const db = require('../../../db/db')
const aws = require('../../../system/aws')

const UserManager = require('../manager/userManager')
const AuthManager = require('../../auth/manager/authManager')
const SurveyManager = require('../../survey/manager/surveyManager')

const Survey = require('../../../../core/survey/survey')
const User = require('../../../../core/user/user')
const AuthGroups = require('../../../../core/auth/authGroups')
const Authorizer = require('../../../../core/auth/authorizer')

const SystemError = require('../../../utils/systemError')
const UnauthorizedError = require('../../../utils/unauthorizedError')
const Mailer = require('../../../utils/mailer')

// ====== CREATE

const inviteUser = async (user, surveyId, email, groupUuid, serverUrl) => {
  const group = await AuthManager.fetchGroupByUuid(groupUuid)

  // Only system admins can invite new system admins
  if (!User.isSystemAdmin(user) && AuthGroups.isSystemAdminGroup(group)) {
    throw new UnauthorizedError(User.getName(user))
  }

  const survey = await SurveyManager.fetchSurveyById(surveyId, true)
  const surveyInfo = Survey.getSurveyInfo(survey)

  // If the survey is not published, only survey admins and system admins can be invited
  if (!Survey.isPublished(surveyInfo) && !(AuthGroups.isSystemAdminGroup(group) || Survey.isAuthGroupAdmin(group)(surveyInfo))) {
    throw new UnauthorizedError(User.getName(user))
  }

  const dbUser = await UserManager.fetchUserByEmail(email)
  const lang = User.getLang(user)
  const surveyLabel = Survey.getLabel(surveyInfo, lang)
  const groupName = AuthGroups.getName(group)
  const groupLabel = `$t(authGroups.${groupName}.label)`

  if (dbUser) {
    const newUserGroups = User.getAuthGroups(dbUser)
    const hasRoleInSurvey = newUserGroups.some(g => AuthGroups.getSurveyUuid(g) === Survey.getUuid(surveyInfo))

    if (hasRoleInSurvey) {
      throw new SystemError('appErrors.userHasRole')
    }
    if (User.isSystemAdmin(dbUser)) {
      throw new SystemError('appErrors.userIsAdmin')
    }

    await db.tx(async t => {
      await UserManager.addUserToGroup(user, surveyId, groupUuid, dbUser, t)
      await Mailer.sendEmail(email, 'emails.userInvite', { serverUrl, surveyLabel, groupLabel }, lang)
    })
  } else {
    await db.tx(async t => {
      try {
        const password = passwordGenerator.generate({ length: 8, numbers: true, uppercase: true, strict: true })
        // add user to cognito pool
        const { User: { Username: userUuid } } = await aws.inviteUser(email, password)
        // add user to db
        await UserManager.insertUser(user, surveyId, userUuid, email, groupUuid, t)
        // send email
        const msgParams = {
          serverUrl,
          email,
          password,
          surveyLabel,
          groupLabel,
          temporaryPasswordMsg: '$t(emails.userInvite.temporaryPasswordMsg)'
        }
        await Mailer.sendEmail(email, 'emails.userInvite', msgParams, lang)
      } catch (e) {
        await aws.deleteUser(email)
        throw e
      }
    })
  }
}

// ====== READ

const fetchUsersBySurveyId = async (user, surveyId, offset, limit) => {
  const fetchSystemAdmins = User.isSystemAdmin(user)

  return await UserManager.fetchUsersBySurveyId(surveyId, offset, limit, fetchSystemAdmins)
}

const countUsersBySurveyId = async (user, surveyId) => {
  const countSystemAdmins = User.isSystemAdmin(user)

  return await UserManager.countUsersBySurveyId(surveyId, countSystemAdmins)
}

// ====== UPDATE

const updateUser = async (user, surveyId, userUuid, name, email, groupUuid, file) => {
  const survey = await SurveyManager.fetchSurveyById(surveyId)
  const surveyInfo = Survey.getSurveyInfo(survey)
  const userToUpdate = await UserManager.fetchUserByUuid(userUuid)
  const groupToUpdate = Authorizer.getSurveyUserGroup(userToUpdate, surveyInfo)

  if (AuthGroups.getUuid(groupToUpdate) !== groupUuid && !Authorizer.canEditUserGroup(user, surveyInfo, userToUpdate)) {
    throw new UnauthorizedError(User.getName(user))
  }

  // Check if email has changed
  const oldEmail = User.getEmail(userToUpdate)
  const oldName = User.getName(userToUpdate)
  if (oldEmail !== email) {
    // Throw exception if user is not allowed to edit the email
    const canEditEmail = Authorizer.canEditUserEmail(user, Survey.getSurveyInfo(survey), userToUpdate)
    if (!canEditEmail) {
      throw new UnauthorizedError(User.getName(user))
    }
  }
  await aws.updateUser(oldEmail, oldEmail !== email ? email : null, oldName !== name ? name : null)

  // Get profile picture
  const profilePicture = file ? fs.readFileSync(file.tempFilePath) : null
  return await UserManager.updateUser(user, surveyId, userUuid, name, email, groupUuid, profilePicture)
}

const acceptInvitation = async (user, userUuid, name, client = db) => {
  // For now a user can change only his own name
  if (User.getUuid(user) !== userUuid)
    throw new UnauthorizedError(User.getName(user))

  await client.tx(async t => {
    const userUpdated = await UserManager.updateUsername(user, name, t)
    // update user name in aws
    await aws.updateUser(User.getEmail(userUpdated), null, name)
  })
}

module.exports = {
  // ==== User
  // CREATE
  inviteUser,

  // READ
  countUsersBySurveyId,
  fetchUsersBySurveyId,
  fetchUserByUuid: UserManager.fetchUserByUuid,
  fetchUserProfilePicture: UserManager.fetchUserProfilePicture,

  // UPDATE
  updateUser,
  acceptInvitation,

  // DELETE
  deleteUser: UserManager.deleteUser,

  // ==== User prefs
  updateUserPrefs: UserManager.updateUserPrefs,
}