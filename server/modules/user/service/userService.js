import * as fs from 'fs'

import * as passwordGenerator from 'generate-password'

import { db } from '@server/db/db'
import * as aws from '@server/system/aws'

import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as AuthGroup from '@core/auth/authGroup'
import * as Authorizer from '@core/auth/authorizer'

import SystemError from '@core/systemError'
import UnauthorizedError from '@server/utils/unauthorizedError'
import * as Mailer from '@server/utils/mailer'
import * as SurveyManager from '../../survey/manager/surveyManager'
import * as AuthManager from '../../auth/manager/authManager'
import * as UserManager from '../manager/userManager'

// ====== CREATE

export const inviteUser = async (
  user,
  surveyId,
  surveyCycleKey,
  email,
  groupUuid,
  serverUrl,
) => {
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
    !(
      AuthGroup.isSystemAdminGroup(group) ||
      Survey.isAuthGroupAdmin(group)(surveyInfo)
    )
  ) {
    throw new UnauthorizedError(User.getName(user))
  }

  const dbUser = await UserManager.fetchUserByEmail(email)
  const lang = User.getLang(user)
  const surveyLabel = Survey.getLabel(surveyInfo, lang)
  const groupName = AuthGroup.getName(group)
  const groupLabel = `$t(authGroups.${groupName}.label)`

  if (dbUser) {
    const newUserGroups = User.getAuthGroups(dbUser)
    const hasRoleInSurvey = newUserGroups.some(
      g => AuthGroup.getSurveyUuid(g) === Survey.getUuid(surveyInfo),
    )

    if (!User.hasAccepted(dbUser)) {
      throw new SystemError('appErrors.userHasPendingInvitation', { email })
    } else if (hasRoleInSurvey) {
      throw new SystemError('appErrors.userHasRole')
    } else if (User.isSystemAdmin(dbUser)) {
      throw new SystemError('appErrors.userIsAdmin')
    }

    await db.tx(async t => {
      await UserManager.addUserToGroup(user, surveyId, groupUuid, dbUser, t)
      await Mailer.sendEmail(
        email,
        'emails.userInvite',
        { serverUrl, surveyLabel, groupLabel },
        lang,
      )
    })
  } else {
    await db.tx(async t => {
      try {
        const password = passwordGenerator.generate({
          length: 8,
          numbers: true,
          uppercase: true,
          strict: true,
        })
        // Add user to cognito pool
        const {
          User: { Username: userUuid },
        } = await aws.inviteUser(email, password)
        // Add user to db
        await UserManager.insertUser(
          user,
          surveyId,
          surveyCycleKey,
          userUuid,
          email,
          groupUuid,
          t,
        )
        // Send email
        const msgParams = {
          serverUrl,
          email,
          password,
          surveyLabel,
          groupLabel,
          temporaryPasswordMsg: '$t(emails.userInvite.temporaryPasswordMsg)',
        }
        await Mailer.sendEmail(email, 'emails.userInvite', msgParams, lang)
      } catch (error) {
        await aws.deleteUser(email)
        throw error
      }
    })
  }
}

// ====== READ

export const fetchUsersBySurveyId = async (user, surveyId, offset, limit) => {
  const fetchSystemAdmins = User.isSystemAdmin(user)

  return await UserManager.fetchUsersBySurveyId(
    surveyId,
    offset,
    limit,
    fetchSystemAdmins,
  )
}

export const countUsersBySurveyId = async (user, surveyId) => {
  const countSystemAdmins = User.isSystemAdmin(user)

  return await UserManager.countUsersBySurveyId(surveyId, countSystemAdmins)
}

export const fetchUserByUuid = UserManager.fetchUserByUuid
export const fetchUserProfilePicture = UserManager.fetchUserProfilePicture

// ====== UPDATE

export const updateUser = async (
  user,
  surveyId,
  userUuid,
  name,
  email,
  groupUuid,
  file,
) => {
  const userToUpdate = await UserManager.fetchUserByUuid(userUuid)
  const oldEmail = User.getEmail(userToUpdate)
  const oldName = User.getName(userToUpdate)

  // If not surveyId, user is updating him/her self
  if (surveyId) {
    const survey = await SurveyManager.fetchSurveyById(surveyId)
    const surveyInfo = Survey.getSurveyInfo(survey)
    const groupToUpdate = User.getAuthGroupBySurveyUuid(
      Survey.getUuid(surveyInfo),
    )(userToUpdate)

    if (
      AuthGroup.getUuid(groupToUpdate) !== groupUuid &&
      !Authorizer.canEditUserGroup(user, surveyInfo, userToUpdate)
    ) {
      throw new UnauthorizedError(User.getName(user))
    }

    // Check if email has changed
    if (oldEmail !== email) {
      // Throw exception if user is not allowed to edit the email
      const canEditEmail = Authorizer.canEditUserEmail(
        user,
        surveyInfo,
        userToUpdate,
      )
      if (!canEditEmail) {
        throw new UnauthorizedError(User.getName(user))
      }
    }
  }

  await aws.updateUser(
    oldEmail,
    oldEmail !== email ? email : null,
    oldName !== name ? name : null,
  )

  // Get profile picture
  const profilePicture = file ? fs.readFileSync(file.tempFilePath) : null
  return await UserManager.updateUser(
    user,
    surveyId,
    userUuid,
    name,
    email,
    groupUuid,
    profilePicture,
  )
}

export const acceptInvitation = async (user, userUuid, name, client = db) => {
  // For now a user can change only his own name
  if (User.getUuid(user) !== userUuid) {
    throw new UnauthorizedError(User.getName(user))
  }

  await client.tx(async t => {
    const userUpdated = await UserManager.updateUsername(user, name, t)
    // Update user name in aws
    await aws.updateUser(User.getEmail(userUpdated), null, name)
  })
}

// DELETE
export const deleteUser = UserManager.deleteUser

// ==== User prefs
export const updateUserPrefs = UserManager.updateUserPrefs
