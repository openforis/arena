import * as fs from 'fs'

import { db } from '@server/db/db'

import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as UserInvite from '@core/user/userInvite'
import * as UserAccessRequest from '@core/user/userAccessRequest'
import * as UserAccessRequestValidator from '@core/user/userAccessRequestValidator'
import * as UserAccessRequestAcceptValidator from '@core/user/userAccessRequestAcceptValidator'
import * as AuthGroup from '@core/auth/authGroup'
import * as Authorizer from '@core/auth/authorizer'
import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'

import SystemError, { StatusCodes } from '@core/systemError'
import UnauthorizedError from '@server/utils/unauthorizedError'
import * as Mailer from '@server/utils/mailer'
import { ReCaptchaUtils } from '@server/utils/reCaptchaUtils'

import * as SurveyManager from '../../survey/manager/surveyManager'
import * as AuthManager from '../../auth/manager/authManager'
import * as UserManager from '../manager/userManager'
import * as UserInvitationManager from '../manager/userInvitationManager'
import * as UserPasswordUtils from './userPasswordUtils'

// ====== CREATE

const _generateResetPasswordAndSendEmail = async (email, emailParams, lang, t) => {
  const { serverUrl } = emailParams
  // Add user to reset password table
  const { uuid } = await UserManager.generateResetPasswordUuid(email, t)
  // Add reset password url to message params
  const msgParams = {
    ...emailParams,
    urlResetPassword: `${serverUrl}/guest/resetPassword/${uuid}`,
  }
  // Send email
  await Mailer.sendEmail({ to: email, msgKey: 'emails.userInvite', msgParams, lang })
}

const _checkUserCanBeInvited = (userToInvite, surveyUuid) => {
  if (!User.hasAccepted(userToInvite)) {
    throw new SystemError(
      'appErrors.userHasPendingInvitation',
      { email: User.getEmail(userToInvite) },
      StatusCodes.CONFLICT
    )
  }
  const authGroups = User.getAuthGroups(userToInvite)
  const hasRoleInSurvey = Boolean(authGroups.some((g) => AuthGroup.getSurveyUuid(g) === surveyUuid))

  if (hasRoleInSurvey) {
    throw new SystemError('appErrors.userHasRole')
  }
  if (User.isSystemAdmin(userToInvite)) {
    throw new SystemError('appErrors.userIsAdmin')
  }
}

const _inviteNewUserAndSendEmail = async ({ user, email, group, survey, surveyCycleKey, emailParams, lang }, t) => {
  // Add user to db
  const userToInvite = await UserManager.insertUser(
    {
      user,
      surveyInfo: Survey.getSurveyInfo(survey),
      surveyCycleKey,
      email,
      password: null,
      status: User.userStatus.INVITED,
      group,
    },
    t
  )
  // Generate reset password and send email
  await _generateResetPasswordAndSendEmail(email, emailParams, lang, t)

  await UserInvitationManager.insertUserInvitation({ user, survey, userToInvite }, t)

  return userToInvite
}

const _checkCanInviteToGroup = ({ user, group, surveyInfo }) => {
  // Only system admins can invite new system admins
  if (!User.isSystemAdmin(user) && AuthGroup.isSystemAdminGroup(group)) {
    throw new UnauthorizedError(User.getName(user))
  }
  // Only system admins or survey managers can invite new survey managers
  if (AuthGroup.isSurveyManagerGroup(group) && !(User.isSystemAdmin(user) || User.isSurveyManager(user))) {
    throw new UnauthorizedError(User.getName(user))
  }

  // If the survey is not published, only system admins, survey managers and survey admins can be invited
  if (
    !Survey.isPublished(surveyInfo) &&
    AuthGroup.isSurveyGroup(group) &&
    !Survey.isAuthGroupAdmin(group)(surveyInfo)
  ) {
    throw new UnauthorizedError(User.getName(user))
  }
}

export const inviteUser = async (
  { user, surveyId, surveyCycleKey, userToInvite: userToInviteParam, serverUrl, repeatInvitation = false },
  client = db
) => {
  const groupUuid = UserInvite.getGroupUuid(userToInviteParam)
  const group = await AuthManager.fetchGroupByUuid(groupUuid, client)
  const groupName = AuthGroup.getName(group)

  const survey = await SurveyManager.fetchSurveyById({ surveyId, draft: true }, client)
  const surveyInfo = Survey.getSurveyInfo(survey)

  _checkCanInviteToGroup({ user, group, surveyInfo })

  const email = UserInvite.getEmail(userToInviteParam)
  const userToInvite = await UserManager.fetchUserByEmail(email)
  const lang = User.getLang(user)
  const emailParams = {
    serverUrl,
    surveyName: Survey.getName(surveyInfo),
    surveyLabel: Survey.getLabel(surveyInfo, lang),
    groupLabel: `$t(authGroups.${groupName}.label)`,
    groupPermissions: `$t(userInviteView.groupPermissions.${groupName})`,
  }

  return client.tx(async (t) => {
    if (userToInvite) {
      // User to invite already exists

      if (User.hasAccepted(userToInvite)) {
        // User has already accepted an invitation previously
        // Check can be invited
        _checkUserCanBeInvited(userToInvite, Survey.getUuid(surveyInfo))

        // Add user to group (accept automatically the invitation)
        await UserManager.addUserToGroup({ user, surveyInfo, group, userToAdd: userToInvite }, t)
        // Send email
        await Mailer.sendEmail({ to: email, msgKey: 'emails.userInviteExistingUser', msgParams: emailParams, lang })
      } else if (repeatInvitation) {
        // User has a pending invitation still
        // Generate reset password and send email again
        await _generateResetPasswordAndSendEmail(email, emailParams, lang, t)
        await UserInvitationManager.insertUserInvitation({ user, survey, userToInvite }, t)
      } else {
        throw new SystemError('appErrors.userHasPendingInvitation', { email }, StatusCodes.CONFLICT)
      }
      return { userInvited: userToInvite }
    } else {
      // User to invite does not exist, he has never been invited
      // Check if he can be invited
      const userInvited = await _inviteNewUserAndSendEmail(
        { user, email, group, survey, surveyCycleKey, emailParams, lang },
        t
      )
      return { userInvited }
    }
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
      await Mailer.sendEmail({ to: email, msgKey: 'emails.userResetPassword', msgParams: { url, name }, lang })
      return { uuid }
    })
  } catch (error) {
    return { error: error.message }
  }
}

const _checkUserAccessRequest = async ({ userAccessRequest }) => {
  // verify reCaptcha
  const { reCaptchaToken } = userAccessRequest
  const reCaptchaVerified = await ReCaptchaUtils.verifyReCaptcha({ token: reCaptchaToken })
  if (!reCaptchaVerified) {
    return { error: 'validationErrors.userAccessRequest.invalidReCaptcha' }
  }
  // validate request
  const validation = await UserAccessRequestValidator.validateUserAccessRequest(userAccessRequest)
  if (!Validation.isValid(validation)) {
    return { error: 'validationErrors.userAccessRequest.invalidRequest', validation }
  }
  // verify user not already existing
  const { email } = userAccessRequest
  const existingUser = await UserManager.fetchUserByEmail(email)
  if (existingUser) {
    return { error: 'validationErrors.userAccessRequest.userAlreadyExisting', errorParams: { email } }
  }
  // verify request not already existing
  const existingRequest = await UserManager.fetchUserAccessRequestByEmail({ email })
  if (existingRequest) {
    return { error: 'validationErrors.userAccessRequest.requestAlreadySent', errorParams: { email } }
  }
  return { ok: true }
}

export const insertUserAccessRequest = async ({ userAccessRequest, serverUrl }) => {
  const requestCheck = await _checkUserAccessRequest({ userAccessRequest })
  if (requestCheck.error) {
    return requestCheck
  }
  try {
    return await db.tx(async (t) => {
      const systemAdminEmails = await UserManager.fetchSystemAdministratorsEmail(t)
      const { email, props } = userAccessRequest
      await Mailer.sendEmail({
        to: systemAdminEmails,
        msgKey: 'emails.userAccessRequest',
        msgParams: { ...props, email, serverUrl },
      })

      const requestInserted = await UserManager.insertUserAccessRequest({ userAccessRequest }, t)
      return { requestInserted }
    })
  } catch (error) {
    return { error: error.message }
  }
}

export const acceptUserAccessRequest = async ({ user, serverUrl, accessRequestAccept }) =>
  db.tx(async (t) => {
    const { accessRequestUuid, surveyName, surveyLabel, role } = accessRequestAccept

    // 1) validation
    // check access request exists
    const accessRequestDb = await UserManager.fetchUserAccessRequestByUuid({ uuid: accessRequestUuid }, t)
    if (!accessRequestDb) {
      return {
        validation: Validation.newInstance(false, {}, [
          Validation.messageKeys.userAccessRequestAccept.accessRequestNotFound,
        ]),
      }
    }

    const { email, status: accessRequestStatus } = accessRequestDb

    // check access request not processed already
    if (accessRequestStatus !== UserAccessRequest.status.CREATED) {
      return {
        validation: Validation.newInstance(false, {}, [
          ValidationResult.newInstance(Validation.messageKeys.userAccessRequestAccept.accessRequestAlreadyProcessed),
        ]),
      }
    }

    // validate survey name
    const surveyInfosWithSameName = await SurveyManager.fetchSurveysByName(surveyName, t)
    const validation = await UserAccessRequestAcceptValidator.validateUserAccessRequestAccept({
      accessRequestAccept,
      surveyInfosWithSameName,
    })
    if (Validation.isNotValid(validation)) {
      return { validation }
    }

    // 2) insert survey
    const surveyInfoTarget = Survey.newSurvey({
      ownerUuid: User.getUuid(user),
      name: surveyName,
      label: surveyLabel,
      languages: ['en'],
    })
    const survey = await SurveyManager.insertSurvey({ user, surveyInfo: surveyInfoTarget, updateUserPrefs: false }, t)

    // 3) find group to associate to the user
    let group = null
    if ([AuthGroup.groupNames.systemAdmin, AuthGroup.groupNames.surveyManager].includes(role)) {
      group = User.getAuthGroupByName(role)(user)
    } else {
      const surveyGroups = await AuthManager.fetchSurveyGroups(Survey.getId(survey), t)
      group = surveyGroups.find((surveyGroup) => AuthGroup.getName(surveyGroup) === role)
    }

    // 4) invite user to that group and send email
    const { userInvited } = await inviteUser(
      {
        user,
        surveyId: Survey.getId(survey),
        surveyCycleKey: Survey.cycleOneKey,
        userToInvite: UserInvite.newUserInvite(email, AuthGroup.getUuid(group)),
        serverUrl,
      },
      t
    )
    return { survey, userInvited }
  })

// ====== READ

export const fetchUsersBySurveyId = async (user, surveyId, offset, limit) => {
  const isSystemAdmin = User.isSystemAdmin(user)

  return UserManager.fetchUsersBySurveyId(surveyId, offset, limit, isSystemAdmin)
}

export const countUsersBySurveyId = async (user, surveyId) => {
  const isSystemAdmin = User.isSystemAdmin(user)

  return UserManager.countUsersBySurveyId(surveyId, isSystemAdmin)
}

export const {
  fetchUserByUuid,
  fetchUserByUuidWithPassword,
  fetchUserProfilePicture,
  countUserAccessRequests,
  fetchUserAccessRequests,
} = UserManager

export const findResetPasswordUserByUuid = async (resetPasswordUuid) => {
  const userUuid = await UserManager.findResetPasswordUserUuidByUuid(resetPasswordUuid)
  return userUuid ? UserManager.fetchUserByUuid(userUuid) : null
}

export const { fetchUserInvitationsBySurveyUuid } = UserInvitationManager

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
