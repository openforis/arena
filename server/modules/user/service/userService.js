import * as fs from 'fs'

import { WebSocketEvent, WebSocketServer } from '@openforis/arena-server'

import { db } from '@server/db/db'

import * as ProcessUtils from '@core/processUtils'
import { Countries } from '@core/Countries'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as UserGroupInvitation from '@core/user/userGroupInvitation'
import * as UserAccessRequest from '@core/user/userAccessRequest'
import * as UserAccessRequestValidator from '@core/user/userAccessRequestValidator'
import * as UserAccessRequestAcceptValidator from '@core/user/userAccessRequestAcceptValidator'
import * as AuthGroup from '@core/auth/authGroup'
import * as Authorizer from '@core/auth/authorizer'
import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import { UserPasswordChangeFormValidator } from '@core/user/userPasswordChangeFormValidator'
import { UserPasswordChangeForm } from '@core/user/userPasswordChangeForm'
import SystemError from '@core/systemError'

import UnauthorizedError from '@server/utils/unauthorizedError'
import * as Mailer from '@server/utils/mailer'
import { ReCaptchaUtils } from '@server/utils/reCaptchaUtils'
import * as Log from '@server/log/log'

import * as ActivityLogManager from '@server/modules/activityLog/manager/activityLogManager'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import SurveyCloneJob from '@server/modules/survey/service/clone/surveyCloneJob'
import * as SurveyManager from '../../survey/manager/surveyManager'
import * as AuthManager from '../../auth/manager/authManager'
import * as UserManager from '../manager/userManager'
import * as UserInvitationManager from '../manager/userInvitationManager'

import * as UserPasswordUtils from './userPasswordUtils'
import { SystemAdminUserValidator } from './systemAdminUserValidator'
import * as UserInviteService from './userInviteService'

const Logger = Log.getLogger('UserService')

// ====== CREATE

export const insertSystemAdminUserIfNotExisting = async (client = db) =>
  client.tx(async (t) => {
    Logger.debug('checking if admin users exist...')
    const aminsCount = await UserManager.countSystemAdministrators(t)
    if (aminsCount > 0) {
      Logger.info(`${aminsCount} admin users found; skipping admin user insert`)
      return null
    }
    const throwError = (details) => {
      throw new SystemError(`Cannot create system admin user: ${details}`)
    }
    const email = ProcessUtils.ENV.adminEmail
    const password = ProcessUtils.ENV.adminPassword
    if (!email && !password) throwError(`email or password not specified in environment variables`)

    const validation = await SystemAdminUserValidator.validate({ email, password })
    if (Validation.isNotValid(validation)) throwError(`email or password are not valid or password is unsafe`)

    const existingUser = await UserManager.fetchUserByEmail(email, t)
    if (existingUser) throwError(`user with email ${email} already exists`)

    Logger.debug(`inserting system admin user with email: ${email}`)
    const passwordEncrypted = UserPasswordUtils.encryptPassword(password)
    const user = await UserManager.insertSystemAdminUser({ email, password: passwordEncrypted }, t)
    Logger.info(`system admin user with email ${email} inserted successfully!`)
    return user
  })

/**
 * Generates a new reset password uuid.
 * It returns an object like { uuid } if the reset password uuid has been generated without problems
 * or an object like { error } if an error occurred.
 *
 * @param {!string} email - Email of the user.
 * @param {!string} serverUrl - Address of the server.
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
    const requestInserted = await UserManager.insertUserAccessRequest({ userAccessRequest })

    const { email, props } = userAccessRequest
    const { country: countryCode } = props
    const country = countryCode ? Countries.getCountryName({ code: countryCode }) : ''

    // send the emails only after use access request has been inserted into the db
    const systemAdminEmails = await UserManager.fetchSystemAdministratorsEmail()

    await Mailer.sendEmail({
      to: systemAdminEmails,
      msgKey: 'emails.userAccessRequest',
      msgParams: { ...props, country, email, serverUrl },
    })
    return { requestInserted }
  } catch (error) {
    return { error: error.message }
  }
}

const _fetchSurveyTemplateId = async ({ user, templateUuid }) => {
  const templates = await SurveyManager.fetchUserSurveysInfo({ user, draft: false, template: true })
  const template = templates.find((t) => t.uuid === templateUuid)
  return template ? Survey.getId(template) : null
}

const _insertOrCloneSurvey = async ({ user, surveyInfoTarget, templateUuid }, t) => {
  const templateId = templateUuid ? await _fetchSurveyTemplateId({ user, templateUuid }) : null
  if (templateId) {
    const job = new SurveyCloneJob({ user, surveyId: templateId, surveyInfoTarget })
    await job.start() // do not clone survey under the same transaction; if job fails, the temporary survey will be deleted automatically;
    if (job.isFailed()) {
      throw new SystemError('systemError.userAccessRequest.acceptFailed.errorCloningTemplate', { templateUuid })
    } else {
      const surveyId = job.result.surveyId
      return await SurveyManager.fetchSurveyById({ surveyId, draft: true })
    }
  }
  return await SurveyManager.insertSurvey({ user, surveyInfo: surveyInfoTarget, updateUserPrefs: false }, t)
}

export const acceptUserAccessRequest = async ({ user, serverUrl, accessRequestAccept }) =>
  db.tx(async (t) => {
    const { accessRequestUuid, surveyName, surveyLabel, role, templateUuid = null } = accessRequestAccept

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

    const survey = await _insertOrCloneSurvey({ user, surveyInfoTarget, templateUuid }, t)

    // 3) find group to associate to the user
    let group = null
    if ([AuthGroup.groupNames.systemAdmin, AuthGroup.groupNames.surveyManager].includes(role)) {
      group = await AuthManager.fetchGroupByName({ name: role }, t)
    } else {
      const surveyGroups = await AuthManager.fetchSurveyGroups(Survey.getId(survey), t)
      group = surveyGroups.find((surveyGroup) => AuthGroup.getName(surveyGroup) === role)
    }

    // 4) invite user to that group and send email
    const { userInvited } = await UserInviteService.inviteUser(
      {
        user,
        surveyId: Survey.getId(survey),
        surveyCycleKey: Survey.cycleOneKey,
        invitation: UserGroupInvitation.newUserGroupInvitation(email, AuthGroup.getUuid(group)),
        serverUrl,
      },
      t
    )
    return { survey, userInvited }
  })

// ====== READ

export const {
  countUsers,
  countUsersBySurveyId,
  exportUserAccessRequestsIntoStream,
  fetchUsers,
  fetchUserByUuid,
  fetchUserByUuidWithPassword,
  fetchUsersBySurveyId,
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

const _checkCanUpdateUser = async ({ user, surveyId, userToUpdate }) => {
  const userToUpdateOld = await UserManager.fetchUserByUuid(User.getUuid(userToUpdate))
  const authGroupsNew = await AuthManager.fetchGroupsByUuids(User.getAuthGroupsUuids(userToUpdate))

  const userToUpdateWillBeSystemAdmin = authGroupsNew.some(AuthGroup.isSystemAdminGroup)
  const userToUpdateWillBeSurveyManager = authGroupsNew.some(AuthGroup.isSurveyManagerGroup)

  if (
    !User.isSystemAdmin(user) &&
    (userToUpdateWillBeSystemAdmin ||
      User.isSystemAdmin(userToUpdateOld) ||
      userToUpdateWillBeSurveyManager ||
      User.isSurveyManager(userToUpdateOld))
  ) {
    // only system admins can update other system admins or survey managers or assign that group
    throw new UnauthorizedError(User.getName(user))
  }

  if (surveyId) {
    // If surveyId is not specified, update only user props and picture
    const surveyAuthGroupsNew = authGroupsNew.filter((authGroup) => AuthGroup.getSurveyId(authGroup) === surveyId)
    if (surveyAuthGroupsNew.length > 1) {
      throw new SystemError(`cannot have more than 1 survey group for user (${surveyAuthGroupsNew.length} found)`)
    }

    const authGroupNew = surveyAuthGroupsNew.length > 0 ? surveyAuthGroupsNew[0] : null
    const survey = await SurveyManager.fetchSurveyById({ surveyId })
    const surveyInfo = Survey.getSurveyInfo(survey)
    const authGroupOld = User.getAuthGroupBySurveyUuid({ surveyUuid: Survey.getUuid(surveyInfo) })(userToUpdateOld)
    // Check if group has changed and user can edit group
    if (
      AuthGroup.getUuid(authGroupOld) !== AuthGroup.getUuid(authGroupNew) &&
      !Authorizer.canEditUserGroup(user, surveyInfo, userToUpdateOld)
    ) {
      throw new UnauthorizedError(User.getName(user))
    }

    // Check if email has changed and user can edit email
    if (User.getEmail(userToUpdateOld) !== User.getEmail(userToUpdate)) {
      // Throw exception if user is not allowed to edit the email
      const canEditEmail = Authorizer.canEditUserEmail(user, surveyInfo, userToUpdateOld)
      if (!canEditEmail) {
        throw new UnauthorizedError(User.getName(user))
      }
    }
  }
}

export const updateUser = async (user, surveyId, userToUpdate, file) => {
  await _checkCanUpdateUser({ user, surveyId, userToUpdate })

  // Get profile picture
  const profilePicture = file ? fs.readFileSync(file.tempFilePath) : null
  return UserManager.updateUser(user, surveyId, userToUpdate, profilePicture)
}

export const resetPassword = async ({ uuid: resetPasswordUuid, name, password, title }) => {
  const user = await findResetPasswordUserByUuid(resetPasswordUuid)
  if (user) {
    const passwordEncrypted = UserPasswordUtils.encryptPassword(password)
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

export const updateUserPassword = async ({ user, passwordChangeForm }) => {
  const validation = await UserPasswordChangeFormValidator.validate(passwordChangeForm)
  if (Validation.isNotValid(validation)) {
    return validation
  }
  // check old password
  const oldUser = await UserManager.fetchUserByUuidWithPassword(User.getUuid(user))
  const oldPasswordEncrypted = User.getPassword(oldUser)
  const oldPasswordParam = UserPasswordChangeForm.getOldPassword(passwordChangeForm)

  if (!UserPasswordUtils.comparePassword(oldPasswordParam, oldPasswordEncrypted)) {
    // password not matching the existing one
    return Validation.newInstance(false, {
      [UserPasswordChangeForm.keys.oldPassword]: Validation.newInstance(false, {}, [
        ValidationResult.newInstance(Validation.messageKeys.userPasswordChange.oldPasswordWrong),
      ]),
    })
  }
  // store new password
  const newPassword = UserPasswordChangeForm.getNewPassword(passwordChangeForm)
  const newPasswordEncrypted = UserPasswordUtils.encryptPassword(newPassword)
  await UserManager.updatePassword({ userUuid: User.getUuid(user), password: newPasswordEncrypted })

  return null // no validation errors => ok
}

// DELETE
export const { deleteUserResetPasswordExpired } = UserManager

export const deleteUser = async ({ user, userUuidToRemove, surveyId }) =>
  db.tx(async (t) => {
    const survey = await SurveyManager.fetchSurveyById({ surveyId, draft: true }, t)
    const userToDelete = await UserManager.fetchUserByUuid(userUuidToRemove, t)

    await UserManager.deleteUser({ user, userUuidToRemove, survey }, t)

    await RecordManager.updateRecordsOwner(
      { surveyId, fromOwnerUuid: userUuidToRemove, toOwnerUuid: User.getUuid(user) },
      t
    )

    if (User.hasAccepted(userToDelete)) {
      // Send email
      const surveyInfo = Survey.getSurveyInfo(survey)
      const msgParams = {
        name: User.getName(userToDelete),
        surveyName: Survey.getName(surveyInfo),
        surveyLabel: Survey.getDefaultLabel(surveyInfo),
      }
      const lang = User.getLang(user)
      await Mailer.sendEmail({ to: User.getEmail(userToDelete), msgKey: 'emails.userDeleted', msgParams, lang })
    }
  })

export const deleteExpiredInvitationsUsersAndSurveys = (client = db) =>
  client.tx(async (t) => {
    const surveyIds = await UserManager.fetchSurveyIdsOfExpiredInvitationUsers(t)
    for await (const surveyId of surveyIds) {
      const activityLogsCount = await ActivityLogManager.count({ surveyId }, t)
      // delete survey only if it is brand new
      if (activityLogsCount < 5) {
        await SurveyManager.deleteSurvey(surveyId, { deleteUserPrefs: true }, t)
      }
    }
    const deletedInvitations = await UserInvitationManager.deleteExpiredInvitations(t)
    const deletedUsers = await UserManager.deleteUsersWithExpiredInvitation(t)
    if (deletedUsers.length > 0) {
      const deletedUsersEmails = deletedUsers.map(User.getEmail)
      await UserManager.deleteUserAccessRequestsByEmail({ emails: deletedUsersEmails }, t)
    }
    await UserManager.deleteExpiredUserAccessRequests(t)

    return { deletedSurveyIds: surveyIds, deletedInvitations, deletedUsers }
  })

// ==== User prefs
export const { updateUserPrefs, updateUserPrefsAndFetchGroups } = UserManager

// ==== User Invite
export const { inviteUser } = UserInviteService

// ==== WebSocket events
export const notifyActiveUsersAboutSurveyUpdate = async ({ surveyId }) => {
  const activeUserUuidsUsingSurvey = await UserManager.fetchActiveUserUuidsWithPreferredSurveyId({ surveyId })
  activeUserUuidsUsingSurvey.forEach((userUuid) => {
    WebSocketServer.notifyUser(userUuid, WebSocketEvent.surveyUpdate, { surveyId })
  })
}
