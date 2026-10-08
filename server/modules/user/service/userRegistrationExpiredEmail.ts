// I18n of arena-core does not declare the params of the t function
type I18n = { t: (key: string, params?: Record<string, string>) => string }

type DeletedSurvey = { name: string; label?: string }

type MsgParams = { accountRemovedMsg: string; requestAccessAgainMsg: string }

const msgKey = 'emails:userRegistrationExpired'

const getAccountRemovedMsg = ({ i18n, surveys }: { i18n: I18n; surveys: DeletedSurvey[] }): string => {
  if (surveys.length === 0) {
    return i18n.t(`${msgKey}.accountRemoved`)
  }
  // items rendered one by one: names and labels get HTML escaped
  const surveysList = surveys
    .map(({ name, label }) => i18n.t(`${msgKey}.surveyItem`, { survey: label ? `${name} - ${label}` : name }))
    .join('')
  return i18n.t(`${msgKey}.accountAndSurveysRemoved`, { surveysList })
}

/**
 * Generates the params of the email sent to a user deleted because the registration has never been completed.
 * @param params - The parameters.
 * @param params.i18n - The i18n instance used to translate the email.
 * @param params.surveys - The surveys deleted together with the user.
 * @param params.serverUrl - The public URL of the server (the link to it is omitted when empty).
 * @returns The message params.
 */
const getMsgParams = (params: { i18n: I18n; surveys: DeletedSurvey[]; serverUrl?: string }): MsgParams => {
  const { i18n, surveys, serverUrl } = params
  return {
    accountRemovedMsg: getAccountRemovedMsg({ i18n, surveys }),
    requestAccessAgainMsg: serverUrl ? i18n.t(`${msgKey}.requestAccessAgain`, { serverUrl }) : '',
  }
}

export const UserRegistrationExpiredEmail = { msgKey, getMsgParams }
