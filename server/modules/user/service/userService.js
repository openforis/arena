import * as fs from 'fs'

import { db } from '@server/db/db'

import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as UserInvite from '@core/user/userInvite'
import * as AuthGroup from '@core/auth/authGroup'
import * as Authorizer from '@core/auth/authorizer'

import SystemError, { StatusCodes } from '@core/systemError'
import UnauthorizedError from '@server/utils/unauthorizedError'
import * as Mailer from '@server/utils/mailer'
import * as SurveyManager from '../../survey/manager/surveyManager'
import * as AuthManager from '../../auth/manager/authManager'
import * as UserManager from '../manager/userManager'
import * as UserInvitationManager from '../manager/userInvitationManager'
import * as UserPasswordUtils from './userPasswordUtils'

// ====== CREATE

const _generateResetPasswordAndSendEmail = async (email, emailParams, lang, t) => {
  const { urlServer } = emailParams
  // Add user to reset password table
  const { uuid } = await UserManager.generateResetPasswordUuid(email, t)
  // Add reset password url to message params
  const msgParams = {
    ...emailParams,
    urlResetPassword: `${urlServer}/guest/resetPassword/${uuid}`,
  }
  // Send email
  await Mailer.sendEmail(email, 'emails.userInvite', msgParams, lang)
}

const _checkUserCanBeInvited = (userToInvite, surveyUuid) => {
  const authGroups = User.getAuthGroups(userToInvite)
  const hasRoleInSurvey = authGroups.some((g) => AuthGroup.getSurveyUuid(g) === surveyUuid)

  if (!User.hasAccepted(userToInvite)) {
    throw new SystemError(
      'appErrors.userHasPendingInvitation',
      { email: User.getEmail(userToInvite) },
      StatusCodes.CONFLICT
    )
  } else if (hasRoleInSurvey) {
    throw new SystemError('appErrors.userHasRole')
  } else if (User.isSystemAdmin(userToInvite)) {
    throw new SystemError('appErrors.userIsAdmin')
  }
}

export const inviteUser = async (
  user,
  surveyId,
  surveyCycleKey,
  userToInviteParam,
  urlServer,
  repeatInvitation = false
) => {
  const groupUuid = UserInvite.getGroupUuid(userToInviteParam)
  const group = await AuthManager.fetchGroupByUuid(groupUuid)

  // Only system admins can invite new system admins
  if (!User.isSystemAdmin(user) && AuthGroup.isSystemAdminGroup(group)) {
    throw new UnauthorizedError(User.getName(user))
  }

  const survey = await SurveyManager.fetchSurveyById({ surveyId, draft: true })
  const surveyInfo = Survey.getSurveyInfo(survey)

  // If the survey is not published, only survey admins and system admins can be invited
  if (
    !Survey.isPublished(surveyInfo) &&
    !(AuthGroup.isSystemAdminGroup(group) || Survey.isAuthGroupAdmin(group)(surveyInfo))
  ) {
    throw new UnauthorizedError(User.getName(user))
  }

  const email = UserInvite.getEmail(userToInviteParam)
  let userToInvite = await UserManager.fetchUserByEmail(email)
  const lang = User.getLang(user)
  const emailParams = {
    urlServer,
    surveyLabel: Survey.getLabel(surveyInfo, lang),
    groupLabel: `$t(authGroups.${AuthGroup.getName(group)}.label)`,
  }
  await db.tx(async (t) => {
    if (userToInvite) {
      // User to invite already exists

      if (repeatInvitation) {
        // Generate reset password and send email again
        await _generateResetPasswordAndSendEmail(email, emailParams, lang, t)
      } else {
        // Check can be invited
        _checkUserCanBeInvited(userToInvite, Survey.getUuid(surveyInfo))
        // Add user to group
        await UserManager.addUserToGroup(user, surveyId, groupUuid, userToInvite, t)
        // Send email
        await Mailer.sendEmail(email, 'emails.userInvite', emailParams, lang)
      }
    } else {
      // User to invite does not exist

      // Add user to db
      userToInvite = await UserManager.insertUser(
        {
          user,
          surveyId,
          surveyCycleKey,
          email,
          password: null,
          status: User.userStatus.INVITED,
          groupUuid,
        },
        t
      )
      // Generate reset password and send email
      await _generateResetPasswordAndSendEmail(email, emailParams, lang, t)
    }

    await UserInvitationManager.insertUserInvitation({ user, survey, userToInvite }, t)
  })
}

/**
 * Generates a new reset password uuid.
 * It returns an object like { uuid } if the reset password uuid has been generated without problems
 * or an object like { error } if an error occurred
 */
export const generateResetPasswordUuid = async (email, serverUrl) => {
  try {
    return await db.tx(async (t) => {
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
  const isSystemAdmin = User.isSystemAdmin(user)

  return UserManager.fetchUsersBySurveyId(surveyId, offset, limit, isSystemAdmin)
}

export const countUsersBySurveyId = async (user, surveyId) => {
  const isSystemAdmin = User.isSystemAdmin(user)

  return UserManager.countUsersBySurveyId(surveyId, isSystemAdmin)
}

export const { fetchUserByUuid, fetchUserByUuidWithPassword, fetchUserProfilePicture } = UserManager

export const findResetPasswordUserByUuid = async (resetPasswordUuid) => {
  const userUuid = await UserManager.findResetPasswordUserUuidByUuid(resetPasswordUuid)
  return userUuid ? UserManager.fetchUserByUuid(userUuid) : null
}

export const { fetchUserInvitationsBySurveyId } = UserInvitationManager
// ====== UPDATE

export const updateUser = async (user, surveyId, userToUpdateParam, file) => {
  // If surveyId is not specified, user is updating him/her self
  if (surveyId) {
    const survey = await SurveyManager.fetchSurveyById({ surveyId })
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
  return UserManager.updateUser(user, surveyId, userToUpdateParam, profilePicture)
}

export const resetPassword = async ({ uuid: resetPasswordUuid, name, password, title }) => {
  const user = await findResetPasswordUserByUuid(resetPasswordUuid)
  if (user) {
    const passwordEncrypted = await UserPasswordUtils.encryptPassword(password)
    await db.tx(async (t) => {
      await UserManager.updateNamePasswordAndStatus(
        { userUuid: User.getUuid(user), name, password: passwordEncrypted, status: User.userStatus.ACCEPTED, title },
        t
      )
      await UserManager.deleteUserResetPasswordByUuid(resetPasswordUuid, t)
    })
  } else {
    throw new Error(`User password reset not found or expired: ${resetPasswordUuid}`)
  }
}

// DELETE
export const { deleteUser, deleteUserResetPasswordExpired } = UserManager

// ==== User prefs
export const { updateUserPrefs } = UserManager
