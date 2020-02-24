import * as fs from 'fs'

import { db } from '@server/db/db'

import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as UserInvite from '@core/user/userInvite'
import * as AuthGroup from '@core/auth/authGroup'
import * as Authorizer from '@core/auth/authorizer'

import SystemError from '@core/systemError'
import UnauthorizedError from '@server/utils/unauthorizedError'
import * as Mailer from '@server/utils/mailer'
import * as SurveyManager from '../../survey/manager/surveyManager'
import * as AuthManager from '../../auth/manager/authManager'
import * as UserManager from '../manager/userManager'
import * as UserPasswordUtils from './userPasswordUtils'

// ====== CREATE

export const inviteUser = async (user, surveyId, surveyCycleKey, userToInviteParam, serverUrl) => {
  const groupUuid = UserInvite.getGroupUuid(userToInviteParam)
  const group = await AuthManager.fetchGroupByUuid(groupUuid)

  // Only system admins can invite new system admins
  if (!User.isSystemAdmin(user) && AuthGroup.isSystemAdminGroup(group)) {
    throw new UnauthorizedError(User.getName(user))
  }

  const survey = await SurveyManager.fetchSurveyById(surveyId, true)
  const surveyInfo = Survey.getSurveyInfo(survey)

  // If the survey is not published, only survey admins and system admins can be invited
  if (
    !Survey.isPublished(surveyInfo) &&
    !(AuthGroup.isSystemAdminGroup(group) || Survey.isAuthGroupAdmin(group)(surveyInfo))
  ) {
    throw new UnauthorizedError(User.getName(user))
  }

  const email = UserInvite.getEmail(userToInviteParam)
  const userToInvite = await UserManager.fetchUserByEmail(email)
  const lang = User.getLang(user)
  const surveyLabel = Survey.getLabel(surveyInfo, lang)
  const groupName = AuthGroup.getName(group)
  const groupLabel = `$t(authGroups.${groupName}.label)`

  if (userToInvite) {
    const newUserGroups = User.getAuthGroups(userToInvite)
    const hasRoleInSurvey = newUserGroups.some(g => AuthGroup.getSurveyUuid(g) === Survey.getUuid(surveyInfo))

    if (!User.hasAccepted(userToInvite)) {
      throw new SystemError('appErrors.userHasPendingInvitation', { email })
    } else if (hasRoleInSurvey) {
      throw new SystemError('appErrors.userHasRole')
    } else if (User.isSystemAdmin(userToInvite)) {
      throw new SystemError('appErrors.userIsAdmin')
    }

    await db.tx(async t => {
      await UserManager.addUserToGroup(user, surveyId, groupUuid, userToInvite, t)
      await Mailer.sendEmail(email, 'emails.userInvite', { serverUrl, surveyLabel, groupLabel }, lang)
    })
  } else {
    await db.tx(async t => {
      // Add user to db
      await UserManager.insertUser(user, surveyId, surveyCycleKey, email, null, User.userStatus.INVITED, groupUuid, t)
      // Add user to reset password table
      const { uuid } = await UserManager.generateResetPasswordUuid(email, t)

      // Send email
      const msgParams = {
        serverUrl: `${serverUrl}/guest/resetPassword/${uuid}`,
        surveyLabel,
        groupLabel,
        temporaryMsg: '$t(emails.userInvite.temporaryMsg)',
      }
      await Mailer.sendEmail(email, 'emails.userInvite', msgParams, lang)
    })
  }
}

/**
 * Generates a new reset password uuid.
 * It returns an object like { uuid } if the reset password uuid has been generated without problems
 * or an object like { error } if an error occurred
 */
export const generateResetPasswordUuid = async (email, serverUrl) => {
  try {
    return await db.tx(async t => {
      const { uuid, user } = await UserManager.generateResetPasswordUuid(email, t)
      const url = `${serverUrl}/guest/resetPassword/${uuid}`
      const lang = User.getLang(user)
      const name = User.getName(user)
      await Mailer.sendEmail(email, 'emails.userResetPassword', { url, name }, lang)
      return { uuid }
    })
  } catch (error) {
    return { error: error.message }
  }
}

// ====== READ

export const fetchUsersBySurveyId = async (user, surveyId, offset, limit) => {
  const fetchSystemAdmins = User.isSystemAdmin(user)

  return await UserManager.fetchUsersBySurveyId(surveyId, offset, limit, fetchSystemAdmins)
}

export const countUsersBySurveyId = async (user, surveyId) => {
  const countSystemAdmins = User.isSystemAdmin(user)

  return await UserManager.countUsersBySurveyId(surveyId, countSystemAdmins)
}

export const fetchUserByUuid = UserManager.fetchUserByUuid
export const fetchUserProfilePicture = UserManager.fetchUserProfilePicture

export const findResetPasswordUserByUuid = async resetPasswordUuid => {
  const userUuid = await UserManager.findResetPasswordUserUuidByUuid(resetPasswordUuid)
  return userUuid ? await UserManager.fetchUserByUuid(userUuid) : null
}

// ====== UPDATE

export const updateUser = async (user, surveyId, userToUpdateParam, file) => {
  // If surveyId is not specified, user is updating him/her self
  if (surveyId) {
    const survey = await SurveyManager.fetchSurveyById(surveyId)
    const surveyInfo = Survey.getSurveyInfo(survey)
    const userToUpdate = await UserManager.fetchUserByUuid(User.getUuid(userToUpdateParam))
    const groupToUpdate = User.getAuthGroupBySurveyUuid(Survey.getUuid(surveyInfo))(userToUpdate)

    // Check if group has changed and user can edit group
    if (
      AuthGroup.getUuid(groupToUpdate) !== User.getGroupUuid(userToUpdateParam) &&
      !Authorizer.canEditUserGroup(user, surveyInfo, userToUpdate)
    ) {
      throw new UnauthorizedError(User.getName(user))
    }

    // Check if email has changed and user can edit email
    if (User.getEmail(userToUpdate) !== User.getEmail(userToUpdateParam)) {
      // Throw exception if user is not allowed to edit the email
      const canEditEmail = Authorizer.canEditUserEmail(user, surveyInfo, userToUpdate)
      if (!canEditEmail) {
        throw new UnauthorizedError(User.getName(user))
      }
    }
  }

  // Get profile picture
  const profilePicture = file ? fs.readFileSync(file.tempFilePath) : null
  return await UserManager.updateUser(user, surveyId, userToUpdateParam, profilePicture)
}

export const acceptInvitation = async (userUuid, name, password) => {
  const passwordEncrypted = await UserPasswordUtils.encryptPassword(password)
  await UserManager.updateNamePasswordAndStatus(userUuid, name, passwordEncrypted, User.userStatus.ACCEPTED)
}

export const resetPassword = async (resetPasswordUuid, name, password) => {
  const user = await findResetPasswordUserByUuid(resetPasswordUuid)
  if (user) {
    const passwordEncrypted = await UserPasswordUtils.encryptPassword(password)
    await db.tx(async t => {
      await UserManager.updateNamePasswordAndStatus(
        User.getUuid(user),
        name,
        passwordEncrypted,
        User.userStatus.ACCEPTED,
        t,
      )
      await UserManager.deleteUserResetPasswordByUuid(resetPasswordUuid, t)
    })
  } else {
    throw new Error(`User password reset not found or expired: ${resetPasswordUuid}`)
  }
}

// DELETE
export const deleteUser = UserManager.deleteUser

export const deleteUserResetPasswordExpired = UserManager.deleteUserResetPasswordExpired

// ==== User prefs
export const updateUserPrefs = UserManager.updateUserPrefs
