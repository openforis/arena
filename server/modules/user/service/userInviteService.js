import { marked } from 'marked'

import { db } from '@server/db/db'

import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import { UserInvitation } from '@core/user/userInvitation'
import * as UserGroupInvitation from '@core/user/userGroupInvitation'
import * as AuthGroup from '@core/auth/authGroup'
import * as i18nFactory from '@core/i18n/i18nFactory'
import SystemError, { StatusCodes } from '@core/systemError'

import UnauthorizedError from '@server/utils/unauthorizedError'
import * as Mailer from '@server/utils/mailer'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as AuthManager from '@server/modules/auth/manager/authManager'
import * as UserManager from '../manager/userManager'
import * as UserInvitationManager from '../manager/userInvitationManager'

const _getPrettyFormatUserName = ({ user, i18n }) => {
  const parts = []
  const titleKey = User.getTitle(user)
  if (titleKey && titleKey !== User.titleKeys.preferNotToSay) {
    parts.push(i18n.t(`user.titleValues.${titleKey}`))
  }
  parts.push(User.getName(user))
  return parts.join(' ')
}

const _generateResetPasswordAndSendEmail = async ({ email, emailParams, i18n }, t) => {
  const { serverUrl } = emailParams
  // Add user to reset password table
  const { uuid } = await UserManager.generateResetPasswordUuid(email, t)
  // Add reset password url to message params
  const msgParams = {
    ...emailParams,
    urlResetPassword: `${serverUrl}/guest/resetPassword/${uuid}`,
  }
  // Send email
  await Mailer.sendEmail({ to: email, msgKey: 'emails.userInvite', msgParams, i18n })
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

const _inviteNewUserAndSendEmail = async ({ user, email, group, survey, surveyCycleKey, emailParams, i18n }, t) => {
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
  await _generateResetPasswordAndSendEmail({ email, emailParams, i18n }, t)

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

const _repeatInvitation = async ({ user, survey, userToInvite, email, emailParams, i18n }, t) => {
  const surveyUuid = Survey.getUuid(survey)
  const userToInviteUuid = User.getUuid(userToInvite)
  // Generate reset password and send email again
  await _generateResetPasswordAndSendEmail({ email, emailParams, i18n }, t)
  await UserInvitationManager.deleteUserInvitation({ surveyUuid, userUuid: userToInviteUuid }, t)
  await UserInvitationManager.insertUserInvitation({ user, survey, userToInvite }, t)
}

export const inviteUser = async (
  { user, surveyId, surveyCycleKey, invitation, serverUrl, repeatInvitation = false },
  client = db
) => {
  const groupUuid = UserGroupInvitation.getGroupUuid(invitation)
  const group = await AuthManager.fetchGroupByUuid(groupUuid, client)
  const groupName = AuthGroup.getName(group)

  const survey = await SurveyManager.fetchSurveyById({ surveyId, draft: true }, client)
  const surveyInfo = Survey.getSurveyInfo(survey)
  const surveyUuid = Survey.getUuid(surveyInfo)

  _checkCanInviteToGroup({ user, group, surveyInfo })

  const lang = User.getLang(user)
  const i18n = await i18nFactory.createI18nAsync(lang)
  const email = UserGroupInvitation.getEmail(invitation)
  const userToInvite = await UserManager.fetchUserByEmail(email)
  const message = UserGroupInvitation.getMessage(invitation)
  const messageParam = message ? `<hr><p>${marked.parse(message)}</p><hr>` : undefined
  const invitingUserName = _getPrettyFormatUserName({ user, i18n })

  const emailParams = {
    invitingUserName,
    serverUrl,
    surveyName: Survey.getName(surveyInfo),
    surveyLabel: Survey.getLabel(surveyInfo, lang),
    groupLabel: `$t(authGroups.${groupName}.label)`,
    groupPermissions: `$t(userInviteView.groupPermissions.${groupName})`,
    message: messageParam,
  }

  return client.tx(async (t) => {
    if (!userToInvite) {
      // User to invite does not exist, he has never been invited
      // Check if he can be invited
      const userInvited = await _inviteNewUserAndSendEmail(
        { user, email, group, survey, surveyCycleKey, emailParams, i18n },
        t
      )
      return { userInvited }
    }
    // User to invite already exists
    const userToInviteUuid = User.getUuid(userToInvite)

    if (User.hasAccepted(userToInvite)) {
      // User has already accepted an invitation previously
      // Check can be invited
      _checkUserCanBeInvited(userToInvite, surveyUuid)

      // Add user to group (accept automatically the invitation)
      await UserManager.addUserToGroup({ user, surveyInfo, group, userToAdd: userToInvite }, t)
      // Send email
      await Mailer.sendEmail({ to: email, msgKey: 'emails.userInviteExistingUser', msgParams: emailParams, lang })
    } else if (repeatInvitation) {
      // User has a pending invitation still
      await _repeatInvitation({ user, survey, userToInvite, email, emailParams, i18n }, t)
    } else {
      // check if there is an old removed invitation; in that case allow the user to be invited again;
      const invitation = await UserInvitationManager.fetchUserInvitationBySurveyAndUserUuid({
        surveyUuid,
        userUuid: userToInviteUuid,
      })
      if (invitation && !UserInvitation.hasBeenRemoved(invitation)) {
        throw new SystemError('appErrors.userHasPendingInvitation', { email }, StatusCodes.CONFLICT)
      } else {
        // Add user to group
        await UserManager.addUserToGroup({ user, surveyInfo, group, userToAdd: userToInvite }, t)

        await _repeatInvitation({ user, survey, userToInvite, email, emailParams, i18n }, t)
      }
    }
    return { userInvited: userToInvite }
  })
}
