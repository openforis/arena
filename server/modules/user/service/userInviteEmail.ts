import { ArenaI18n } from '@openforis/arena-core'

type MsgParams = {
  invitingUserName: string
  serverUrl: string
  surveyName: string
  surveyLabel: string
  groupLabel: string
  groupPermissions: string
  message?: string
}

/**
 * Generates the params of the email sent to a user invited to a survey.
 * @param params - The parameters.
 * @param params.i18n - The i18n instance used to translate the email.
 * @param params.invitingUserName - Name of the user sending the invitation.
 * @param params.serverUrl - The public URL of the server.
 * @param params.surveyName - Name of the survey.
 * @param params.surveyLabel - Label of the survey.
 * @param params.groupName - Name of the auth group the user is invited to.
 * @param params.message - Message of the inviting user (HTML).
 * @returns The message params.
 */
const getMsgParams = (params: {
  i18n: ArenaI18n
  invitingUserName: string
  serverUrl: string
  surveyName: string
  surveyLabel: string
  groupName: string
  message?: string
}): MsgParams => {
  const { i18n, invitingUserName, serverUrl, surveyName, surveyLabel, groupName, message } = params
  // translated here: $t() in the param values would disable the nesting in the template (i18next skipOnVariables)
  return {
    invitingUserName,
    serverUrl,
    surveyName,
    surveyLabel,
    groupLabel: i18n.t(`auth:authGroups.${groupName}.label`),
    groupPermissions: i18n.t(`userInviteView.groupPermissions.${groupName}`),
    message,
  }
}

export const UserInviteEmail = { getMsgParams }
