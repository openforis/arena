import * as AuthGroup from '@core/auth/authGroup'
import * as i18nFactory from '@core/i18n/i18nFactory'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import * as Log from '@server/log/log'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as UserManager from '@server/modules/user/manager/userManager'
import * as Mailer from '@server/utils/mailer'

import { RecordsUploadedFromMobileEmail, UploadedRecordInfo } from './recordsUploadedFromMobileEmail'

const logger = Log.getLogger('RecordsUploadNotificationService')

const fetchSurveyAdmins = async ({ surveyId, surveyUuid }: { surveyId: number; surveyUuid: string }) => {
  const users = await UserManager.fetchUsersBySurveyId({ surveyId, onlyAccepted: true })
  return users.filter((user: any) => {
    const authGroup = User.getAuthGroupBySurveyUuid({ surveyUuid })(user)
    return authGroup && AuthGroup.getName(authGroup) === AuthGroup.groupNames.surveyAdmin
  })
}

/**
 * Emails the survey admins the list of records uploaded from Arena Mobile, if the survey option is enabled.
 * @param params - The parameters.
 * @param params.surveyId - The survey id.
 * @param params.user - The user who uploaded the records.
 * @param params.records - The uploaded (inserted or updated) records.
 * @param params.serverUrl - Public URL of the server, linked in the email.
 * @param params.dateSubmitted - Date of the upload.
 * @returns The number of notified survey admins.
 */
export const notifySurveyAdmins = async ({
  surveyId,
  user,
  records,
  serverUrl = null,
  dateSubmitted = new Date(),
}: {
  surveyId: number
  user: any
  records: UploadedRecordInfo[]
  serverUrl?: string | null
  dateSubmitted?: Date
}): Promise<number> => {
  if (records.length === 0) return 0

  // the option is read from the draft survey info: it takes effect without publishing the survey
  const surveyInfo = Survey.getSurveyInfo(await SurveyManager.fetchSurveyById({ surveyId, draft: true }))
  if (!Survey.isNotifyAdminsOnRecordsUploadFromMobile(surveyInfo)) return 0

  const surveyAdmins = await fetchSurveyAdmins({ surveyId, surveyUuid: Survey.getUuid(surveyInfo) })
  if (surveyAdmins.length === 0) return 0

  // emails are sent only in English
  const i18n = await i18nFactory.createI18nAsync('en')
  const { msgKey, getMsgParams } = RecordsUploadedFromMobileEmail
  const commonParams = {
    i18n,
    surveyName: Survey.getName(surveyInfo),
    surveyLabel: Survey.getDefaultLabel(surveyInfo),
    cycleVisible: Survey.getCycleKeys(surveyInfo).length > 1,
    uploadedByName: User.getName(user),
    uploadedByEmail: User.getEmail(user),
    dateSubmitted,
    records,
    serverUrl,
  }
  let notifiedCount = 0
  for (const surveyAdmin of surveyAdmins) {
    const email = User.getEmail(surveyAdmin)
    try {
      const msgParams = getMsgParams({ ...commonParams, recipientName: User.getName(surveyAdmin) })
      await Mailer.sendEmail({ to: email, msgKey, msgParams, i18n }) // NOSONAR
      notifiedCount += 1
    } catch (error) {
      // a failure sending to one admin must not prevent notifying the others
      logger.error(`error notifying survey admin ${email}: ${error.message}`)
    }
  }
  return notifiedCount
}
