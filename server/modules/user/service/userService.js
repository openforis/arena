import * as fs from 'fs'

import { ServiceRegistry } from '@openforis/arena-core'
import { ServerServiceType, WebSocketEvent, WebSocketServer } from '@openforis/arena-server'

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
import SystemError, { StatusCodes } from '@core/systemError'
import { WebSocketEvents } from '@common/webSocket/webSocketEvents'

import UnauthorizedError from '@server/utils/unauthorizedError'
import * as Mailer from '@server/utils/mailer'
import { ReCaptchaUtils } from '@server/utils/reCaptchaUtils'
import * as Log from '@server/log/log'

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
    const adminsCount = await UserManager.countSystemAdministrators(t)
    if (adminsCount > 0) {
      Logger.info(`${adminsCount} admin users found; skipping admin user insert`)
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
 * @param {!string} email - Email of the user.
 * @param {!string} serverUrl - Address of the server.
 * @returns {Promise<object>} - The generated password reset uuid.
 */
export const generateResetPasswordUuid = async (email, serverUrl) => {
  try {
    return await db.tx(async (t) => {
      const { uuid, user } = await UserManager.generateResetPasswordUuid(email, t)
      const url = `${serverUrl}/guest/resetPassword/${uuid}`
      const lang = User.getLang(user)
      const name = User.getName(user)
      await Mailer.sendEmail({ to: email, msgKey: 'emails:userResetPassword', msgParams: { url, name }, lang })
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
    return { error: 'validationErrors:userAccessRequest.invalidReCaptcha' }
  }
  // validate request
  const validation = await UserAccessRequestValidator.validateUserAccessRequest(userAccessRequest)
  if (!Validation.isValid(validation)) {
    return { error: 'validationErrors:userAccessRequest.invalidRequest', validation }
  }
  // verify user not already existing
  const { email } = userAccessRequest
  const existingUser = await UserManager.fetchUserByEmail(email)
  if (existingUser) {
    return { error: 'validationErrors:userAccessRequest.userAlreadyExisting', errorParams: { email } }
  }
  // verify request not already existing
  const existingRequest = await UserManager.fetchUserAccessRequestByEmail({ email })
  if (existingRequest) {
    return { error: 'validationErrors:userAccessRequest.requestAlreadySent', errorParams: { email } }
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
    const { firstName, country: countryCode } = props
    const country = countryCode ? Countries.getCountryName({ code: countryCode }) : ''

    // send a confirmation email to the requester first, to verify that the given email address can be reached
    let rejected = []
    try {
      ;({ rejected } = await Mailer.sendEmail({
        to: email,
        msgKey: 'emails:userAccessRequestConfirmation',
        msgParams: { firstName, serverUrl, supportEmail: ProcessUtils.ENV.supportEmail },
      }))
    } catch {
      // sending failed outright (transport error, provider rejection, etc.): treat like a rejected recipient
      rejected = [email]
    }
    if (rejected.length > 0) {
      await UserManager.deleteUserAccessRequestsByEmail({ emails: [email] })
      return { error: 'validationErrors:userAccessRequest.emailNotReachable', errorParams: { email } }
    }

    // send the emails only after use access request has been inserted into the db
    const systemAdminEmails = await UserManager.fetchSystemAdministratorsEmail()

    await Mailer.sendEmail({
      to: systemAdminEmails,
      msgKey: 'emails:userAccessRequest',
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

const _insertOrCloneSurvey = async ({ user, surveyInfoTarget, templateUuid }) => {
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
  // Insert survey out of the caller's transaction: SurveyManager.insertSurvey creates the survey data
  // schema using its own separate db connections, so it must not run inside a transaction held open by
  // the caller (same connection-pool starvation risk migrateSurveySchema was fixed for elsewhere).
  return await SurveyManager.insertSurvey({ user, surveyInfo: surveyInfoTarget, updateUserPrefs: false })
}

export const acceptUserAccessRequest = async ({ user, serverUrl, accessRequestAccept }) => {
  const { accessRequestUuid, surveyName, surveyLabel, role, templateUuid = null } = accessRequestAccept

  // 1) validation
  // check access request exists
  const accessRequestDb = await UserManager.fetchUserAccessRequestByUuid({ uuid: accessRequestUuid })
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
  const surveyInfosWithSameName = await SurveyManager.fetchSurveysByName(surveyName)
  const validation = await UserAccessRequestAcceptValidator.validateUserAccessRequestAccept({
    accessRequestAccept,
    surveyInfosWithSameName,
  })
  if (Validation.isNotValid(validation)) {
    return { validation }
  }

  // 2) insert or clone survey (out of the transaction below; see _insertOrCloneSurvey)
  const surveyInfoTarget = Survey.newSurvey({
    ownerUuid: User.getUuid(user),
    name: surveyName,
    label: surveyLabel,
    languages: ['en'],
  })

  let survey = await _insertOrCloneSurvey({ user, surveyInfoTarget, templateUuid })
  const surveyId = Survey.getId(survey)

  try {
    return await db.tx(async (t) => {
      // 3) find group to associate to the user
      let group = null
      if ([AuthGroup.groupNames.systemAdmin, AuthGroup.groupNames.surveyManager].includes(role)) {
        group = await AuthManager.fetchGroupByName({ name: role }, t)
      } else {
        const surveyGroups = await AuthManager.fetchSurveyGroups(surveyId, t)
        group = surveyGroups.find((surveyGroup) => AuthGroup.getName(surveyGroup) === role)
      }

      // 4) invite user to that group and send email
      const { invitedUsers } = await UserInviteService.inviteUsers(
        {
          user,
          surveyId,
          surveyCycleKey: Survey.cycleOneKey,
          invitation: UserGroupInvitation.newUserGroupInvitation(email, AuthGroup.getUuid(group)),
          serverUrl,
        },
        t
      )
      const userInvited = invitedUsers[0]
      const surveyOwnerUuid = User.getUuid(userInvited)

      await SurveyManager.updateSurveyOwner({ user, surveyId, ownerUuid: surveyOwnerUuid, system: true }, t)
      survey = Survey.assocOwnerUuid(surveyOwnerUuid)(survey)

      return { survey, userInvited }
    })
  } catch (error) {
    // The survey was already created (committed) outside of this failed transaction; clean it up so a
    // failed access request acceptance doesn't leave an orphaned survey/schema behind.
    Logger.error(`error accepting user access request, cleaning up survey ${surveyId}: ${error.stack || error}`)
    await SurveyManager.deleteSurvey(surveyId, { deleteUserPrefs: true }).catch((cleanupError) => {
      Logger.error(
        `error cleaning up survey ${surveyId} after failed access request acceptance: ${
          cleanupError.stack || cleanupError
        }`
      )
    })
    throw error
  }
}

// ====== READ

export const {
  countUsers,
  countUsersBySurveyId,
  exportUserAccessRequestsIntoStream,
  fetchUsers,
  fetchUserByUuid,
  fetchUserByEmail,
  fetchUserByUuidWithPassword,
  fetchUsersBySurveyId,
  fetchUserProfilePicture,
  countUserAccessRequests,
  fetchUserAccessRequests,
} = UserManager

export { fetchUserSurveysCount } from '../repository/userRepository'

export const findResetPasswordUserByUuid = async (resetPasswordUuid) => {
  const userUuid = await UserManager.findResetPasswordUserUuidByUuid(resetPasswordUuid)
  return userUuid ? UserManager.fetchUserByUuid(userUuid) : null
}

export const { fetchUserInvitationsBySurveyUuid } = UserInvitationManager

export const fetchResetPasswordUrl = async ({ serverUrl, userUuid, surveyId = null }) => {
  if (surveyId) {
    const survey = await SurveyManager.fetchSurveyById({ surveyId })
    const surveyUuid = Survey.getUuid(survey)
    const invitation = await UserInvitationManager.fetchUserInvitationBySurveyAndUserUuid({
      surveyUuid,
      userUuid,
    })
    if (!invitation) {
      throw new SystemError('appErrors:userNotInvitedToSurvey')
    }
  }
  const resetPasswordUuid = await UserManager.fetchResetPasswordUuidByUserUuid(userUuid)
  return UserInviteService.getResetPasswordUrl({ serverUrl, uuid: resetPasswordUuid })
}

// ====== INSERT

export const insertUser = async ({ user, userToInsert, profilePicture = null }) => {
  const email = User.getEmail(userToInsert)
  const status = User.userStatus.ACCEPTED
  const passwordPlain = User.getPassword(userToInsert)
  const passwordEncrypted = passwordPlain ? UserPasswordUtils.encryptPassword(passwordPlain) : null
  const name = User.getName(userToInsert)
  const title = User.getTitle(userToInsert)
  const group = await AuthManager.fetchGroupByName({ name: AuthGroup.groupNames.surveyManager })
  return UserManager.insertUser({
    user,
    email,
    password: passwordEncrypted,
    status,
    group,
    name,
    title,
    profilePicture,
  })
}

// ====== UPDATE

/**
 * Checks if user has permission to assign global roles (system admin, survey manager).
 * @param {!object} params - Parameters object.
 * @param {!object} params.user - The user performing the update.
 * @param {!object} params.userToUpdateOld - The user being updated before changes.
 * @param {!Array} params.authGroupsNew - The new auth groups for the user being updated.
 * @returns {boolean} True if user can assign the given roles, false otherwise.
 */
const _canAssignGlobalRoles = ({ user, userToUpdateOld, authGroupsNew }) => {
  if (User.isSystemAdmin(user)) {
    return true
  }

  const userToUpdateWasSurveyManager = User.isSurveyManager(userToUpdateOld)
  const userToUpdateWillBeSystemAdmin = authGroupsNew.some(AuthGroup.isSystemAdminGroup)
  const userToUpdateWillBeSurveyManager = authGroupsNew.some(AuthGroup.isSurveyManagerGroup)

  // Non-system admins cannot assign system admin role
  if (userToUpdateWillBeSystemAdmin) {
    return false
  }

  // Non-system admins cannot edit other system admins
  if (User.isSystemAdmin(userToUpdateOld)) {
    return false
  }

  // Only survey managers can promote users to survey manager
  if (!userToUpdateWasSurveyManager && userToUpdateWillBeSurveyManager) {
    return false
  }

  return true
}

/**
 * Checks if user has permission to edit survey-specific role and email.
 * @param {!object} params - Parameters object.
 * @param {!object} params.user - The user performing the update.
 * @param {!number} params.surveyId - The survey ID.
 * @param {!object} params.userToUpdateOld - The user being updated before changes.
 * @param {!object} params.userToUpdate - The user being updated with new values.
 * @param {!Array} params.authGroupsNew - The new auth groups for the user being updated.
 * @throws {SystemError} If more than one survey group found for the user.
 * @throws {UnauthorizedError} If user lacks permission to edit group or email.
 */
const _checkCanUpdateSurveyRoleAndEmail = async ({ user, surveyId, userToUpdateOld, userToUpdate, authGroupsNew }) => {
  const surveyAuthGroupsNew = authGroupsNew.filter((authGroup) => AuthGroup.getSurveyId(authGroup) === surveyId)
  if (surveyAuthGroupsNew.length > 1) {
    throw new SystemError(`cannot have more than 1 survey group for user (${surveyAuthGroupsNew.length} found)`)
  }

  const survey = await SurveyManager.fetchSurveyById({ surveyId })
  const surveyInfo = Survey.getSurveyInfo(survey)

  const authGroupNew = surveyAuthGroupsNew.length > 0 ? surveyAuthGroupsNew[0] : null
  const authGroupOld = User.getAuthGroupBySurveyUuid({ surveyUuid: Survey.getUuid(surveyInfo) })(userToUpdateOld)

  // Check if group has changed and user can edit group
  const groupChanged = AuthGroup.getUuid(authGroupOld) !== AuthGroup.getUuid(authGroupNew)
  if (groupChanged && !Authorizer.canEditUserGroup(user, surveyInfo, userToUpdateOld)) {
    throw new UnauthorizedError(User.getName(user))
  }

  // Check if email has changed and user can edit email
  const emailChanged = User.getEmail(userToUpdateOld) !== User.getEmail(userToUpdate)
  if (emailChanged && !Authorizer.canEditUserEmail(user, surveyInfo, userToUpdateOld)) {
    throw new UnauthorizedError(User.getName(user))
  }
}

const _checkCanUpdateUser = async ({ user, surveyId, userToUpdate, userToUpdateOld = null }) => {
  const userToUpdateOldData = userToUpdateOld || (await UserManager.fetchUserByUuid(User.getUuid(userToUpdate)))
  const authGroupsNew = await AuthManager.fetchGroupsByUuids(User.getAuthGroupsUuids(userToUpdate))

  // Check global role assignment permissions
  if (!_canAssignGlobalRoles({ user, userToUpdateOld: userToUpdateOldData, authGroupsNew })) {
    throw new UnauthorizedError(User.getName(user))
  }

  // Check survey-specific permissions if updating survey membership
  if (surveyId) {
    await _checkCanUpdateSurveyRoleAndEmail({
      user,
      surveyId,
      userToUpdateOld: userToUpdateOldData,
      userToUpdate,
      authGroupsNew,
    })
  }
}

export const updateUser = async (user, surveyId, userToUpdate, file) => {
  const userToUpdateUuid = User.getUuid(userToUpdate)
  const userToUpdateOld = surveyId ? await UserManager.fetchUserByUuid(userToUpdateUuid) : null

  await _checkCanUpdateUser({ user, surveyId, userToUpdate, userToUpdateOld })

  // Get profile picture
  const profilePicture = file ? fs.readFileSync(file.tempFilePath) : null
  const updatedUser = await UserManager.updateUser(user, surveyId, userToUpdate, profilePicture)

  if (surveyId) {
    const survey = await SurveyManager.fetchSurveyById({ surveyId })
    const surveyInfo = Survey.getSurveyInfo(survey)
    const surveyUuid = Survey.getUuid(surveyInfo)
    const userToUpdateUpdated = await UserManager.fetchUserByUuid(userToUpdateUuid)

    const authGroupOld = User.getAuthGroupBySurveyUuid({ surveyUuid })(userToUpdateOld)
    const authGroupUpdated = User.getAuthGroupBySurveyUuid({ surveyUuid })(userToUpdateUpdated)

    if (AuthGroup.getUuid(authGroupOld) !== AuthGroup.getUuid(authGroupUpdated)) {
      WebSocketServer.notifyUser(userToUpdateUuid, WebSocketEvents.userRoleUpdate, { surveyId, userRoleChanged: true })
    }
  }

  return updatedUser
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

export const updateUserAuthGroupExtraProps = async ({ surveyId, userUuid, extraProps }) =>
  UserManager.updateUserAuthGroupExtraProps({ surveyId, userUuid, extraProps })

export const updateUserPassword = async ({ user, passwordChangeForm }) => {
  const userUuid = User.getUuid(user)
  const userToUpdateUuid = UserPasswordChangeForm.getUserUuid(passwordChangeForm) ?? userUuid
  const isSystemAdmin = User.isSystemAdmin(user)
  const editingSameUser = userUuid === userToUpdateUuid
  if (!editingSameUser && !isSystemAdmin) {
    throw new UnauthorizedError(User.getName(user))
  }
  const oldPasswordCheck = !isSystemAdmin
  const validation = await UserPasswordChangeFormValidator.validate(passwordChangeForm, {
    includeOldPassword: oldPasswordCheck,
  })
  if (Validation.isNotValid(validation)) {
    return validation
  }
  if (oldPasswordCheck) {
    const oldUser = await UserManager.fetchUserByUuidWithPassword(userToUpdateUuid)
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
  }
  // store new password
  const newPassword = UserPasswordChangeForm.getNewPassword(passwordChangeForm)
  const newPasswordEncrypted = UserPasswordUtils.encryptPassword(newPassword)
  await UserManager.updatePassword({ userUuid: userToUpdateUuid, password: newPasswordEncrypted })

  return null // no validation errors => ok
}

// DELETE
export const { deleteUserResetPasswordExpired } = UserManager

export const deleteUserFromSurvey = async ({ user, userUuidToRemove, surveyId }) => {
  const userToDelete = await db.tx(async (t) => {
    const survey = await SurveyManager.fetchSurveyById({ surveyId, draft: true }, t)
    const userToDeleteData = await UserManager.fetchUserByUuid(userUuidToRemove, t)
    const userPreferredSurveyId = User.getPrefSurveyCurrent(userToDeleteData)

    await UserManager.deleteUserFromSurvey({ user, userUuidToRemove, survey }, t)

    if (String(userPreferredSurveyId) === String(surveyId)) {
      await UserManager.deleteUserPrefsSurvey({ userUuid: userUuidToRemove, surveyId }, t)
    }

    await RecordManager.updateRecordsOwner(
      { surveyId, fromOwnerUuid: userUuidToRemove, toOwnerUuid: User.getUuid(user) },
      t
    )

    if (User.hasAccepted(userToDeleteData)) {
      // Send email
      const surveyInfo = Survey.getSurveyInfo(survey)
      const msgParams = {
        name: User.getName(userToDeleteData),
        surveyName: Survey.getName(surveyInfo),
        surveyLabel: Survey.getDefaultLabel(surveyInfo),
      }
      const lang = User.getLang(user)
      await Mailer.sendEmail({ to: User.getEmail(userToDeleteData), msgKey: 'emails:userDeleted', msgParams, lang })
    }

    return userToDeleteData
  })

  // Notify user only if transaction commits successfully
  WebSocketServer.notifyUser(userUuidToRemove, WebSocketEvents.userRemovedFromSurvey, { surveyId, userRemoved: true })

  return userToDelete
}

export const deleteUser = async ({ user, userUuidToDelete }) =>
  db.tx(async (t) => {
    if (User.getUuid(user) === userUuidToDelete) {
      throw new SystemError('appErrors:userCannotDeleteSelf', {}, StatusCodes.BAD_REQUEST)
    }

    const userToDelete = await UserManager.fetchUserByUuid(userUuidToDelete, t)
    if (!userToDelete) {
      throw new SystemError('appErrors:userNotFound', { userUuid: userUuidToDelete }, StatusCodes.NOT_FOUND)
    }

    if (User.isSystemAdmin(userToDelete)) {
      const adminsCount = await UserManager.countSystemAdministrators(t)
      if (adminsCount <= 1) {
        throw new SystemError('appErrors:userCannotDeleteLastSystemAdmin', {}, StatusCodes.CONFLICT)
      }
    }

    // Surveys the target owns block deletion at the DB level (survey.owner_uuid has no ON DELETE
    // action). Blocked, not auto-reassigned: transferring survey ownership is too significant to do
    // silently as a side effect of deleting an account. Use the unfiltered FK-scoped count (not the
    // UI listing query), since that listing excludes templates/temporary surveys and can miss surveys
    // the target owns but isn't a member of -- letting them slip past this check and hit the FK
    // violation at DELETE time instead.
    const ownedSurveysCount = await SurveyManager.countOwnedSurveys({ user: userToDelete }, t)
    if (ownedSurveysCount > 0) {
      throw new SystemError('appErrors:userCannotDeleteOwnsSurveys', { count: ownedSurveysCount }, StatusCodes.CONFLICT)
    }

    // Messages the target authored block deletion the same way (message.created_by_user_uuid has no
    // ON DELETE action). Avoid fetching all messages; just count by author.
    const ownMessagesCount = await t.one(
      'SELECT COUNT(*)::int AS count FROM "message" WHERE created_by_user_uuid = $1',
      [userUuidToDelete],
      (row) => Number(row.count)
    )
    if (ownMessagesCount > 0) {
      throw new SystemError('appErrors:userCannotDeleteHasMessages', { count: ownMessagesCount }, StatusCodes.CONFLICT)
    }

    // Records the target owns (record.owner_uuid) also block deletion, and can't be nulled out
    // (NOT NULL) -- reassign them to the acting admin. Iterate every survey in the instance rather
    // than the membership-filtered listing query, since that listing can miss surveys the target owns
    // (or owned) records in without being a current member -- e.g. a template/temporary survey, or a
    // membership that was removed after the records were created. A no-op for surveys where the
    // target owns no records, so safe to call unconditionally; no more expensive than the FK check
    // Postgres already has to run against every survey schema to allow the delete at all.
    const allSurveyIds = await SurveyManager.fetchAllSurveyIds(t)
    for (const surveyId of allSurveyIds) {
      await RecordManager.updateRecordsOwner(
        { surveyId, fromOwnerUuid: userUuidToDelete, toOwnerUuid: User.getUuid(user) },
        t
      )
    }

    Logger.info(
      `user ${User.getEmail(user)} [${User.getUuid(user)}] deleted user ${User.getEmail(userToDelete)} ` +
        `[${userUuidToDelete}]; records owned by the deleted user were reassigned to the acting admin, ` +
        `checking ${allSurveyIds.length} surveys`
    )

    // Everything else (sessions, tokens, 2FA, group membership, activity log, invitations this user
    // sent/received, access requests they processed) is cleaned up by the existing ON DELETE CASCADE
    // foreign keys in arena-server's schema -- see the spec's "Cascade side effects" section.
    return UserManager.deleteUser(userUuidToDelete, t)
  })

export const deleteExpiredInvitationsUsersAndSurveys = async (client = db) => {
  const surveyIds = await UserManager.fetchSurveyIdsOfExpiredInvitationUsers(client)
  Logger.info(`IDs of surveys that could be deleted (if without any activity): ${surveyIds}`)

  Logger.debug('deleting users with expired invitations')
  const usersWithExpiredInvitation = await UserManager.fetchUsersWithExpiredInvitation(client)
  const deletedUsers = []
  const deletedUsersEmails = []
  if (usersWithExpiredInvitation.length > 0) {
    const usersWithExpiredInvitationEmails = usersWithExpiredInvitation.map(User.getEmail)
    const usersWithExpiredInvitationUuids = usersWithExpiredInvitation.map(User.getUuid)
    Logger.debug(`deleting users: ${usersWithExpiredInvitationEmails} ${usersWithExpiredInvitationUuids}`)
    for (const user of usersWithExpiredInvitation) {
      const userUuid = User.getUuid(user)
      const userEmail = User.getEmail(user)
      try {
        await UserManager.deleteUser(userUuid, client)
        deletedUsers.push(user)
        deletedUsersEmails.push(userEmail)
      } catch (error) {
        Logger.debug(`error deleting user ${userEmail} [${userUuid}]: ${String(error)}`)
      }
    }
    if (deletedUsersEmails.length > 0) {
      Logger.debug('deleting expired users access requests by expired invitations')
      await UserManager.deleteUserAccessRequestsByEmail({ emails: deletedUsersEmails }, client)
    }
  }
  Logger.debug('deleting expired users access requests')
  await UserManager.deleteExpiredUserAccessRequests(client)

  return { deletedUsers, deletedSurveyIds: surveyIds }
}

// ==== User prefs
export const { updateUserPrefs, updateUserPrefsAndFetchGroups } = UserManager

// ==== User Invite
export const { inviteUsers } = UserInviteService

// ==== WebSocket events
export const notifyActiveUsersAboutSurveyUpdate = async ({ surveyId }) => {
  const activeUserUuidsUsingSurvey = await UserManager.fetchActiveUserUuidsWithPreferredSurveyId({ surveyId })
  for (const userUuid of activeUserUuidsUsingSurvey) {
    WebSocketServer.notifyUser(userUuid, WebSocketEvent.surveyUpdate, { surveyId })
  }
}
