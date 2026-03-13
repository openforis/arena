import * as ProcessUtils from '@core/processUtils'
import * as i18nFactory from '@core/i18n/i18nFactory'

import * as Log from '@server/log/log'
import * as MailerAmazonSES from '@server/utils/mailer/mailerAmazonSES'
import * as MailerOffice365 from '@server/utils/mailer/mailerOffice365'
import * as MailerSendgrid from '@server/utils/mailer/mailerSendgrid'

const logger = Log.getLogger('Mailer')

const emailServices = {
  sendgrid: 'sendgrid',
  office365: 'office365',
  amazonSES: 'amazonSES',
}

const emailService = ProcessUtils.ENV.emailService
const from = ProcessUtils.ENV.emailFrom || ProcessUtils.ENV.adminEmail || ProcessUtils.ENV.emailAuthUser

const emailProviders = {
  [emailServices.sendgrid]: MailerSendgrid,
  [emailServices.office365]: MailerOffice365,
  [emailServices.amazonSES]: MailerAmazonSES,
}

const emailProvider = emailProviders[emailService]

if (!emailProvider) {
  throw new Error(`Invalid email service specified: ${emailService}`)
}

logger.debug(`using ${emailService} email service`)

if (typeof emailProvider.logTransportOptionsType === 'function') {
  logger.debug(`using ${emailProvider.logTransportOptionsType()} email transport options`)
}

emailProvider.validateEnv({ from })
emailProvider.init?.()

export const sendCustomEmail = async ({ to, subject, html, log = true }) => {
  const recipientsCount = Array.isArray(to) ? to.length : 1
  const subjectTruncationLength = 20
  let logMessageCommonPart = 'message'
  if (log) {
    const subjectTruncated =
      subject?.length > subjectTruncationLength ? subject.substring(0, subjectTruncationLength) + '...' : subject
    logMessageCommonPart = `email to ${recipientsCount} recipient(s) with subject ${subjectTruncated}`
  }
  if (log) {
    logger.debug(`sending ${logMessageCommonPart}`)
  }
  try {
    await emailProvider.sendEmail({ to, from, subject, html })
    if (log) {
      logger.debug(`sent ${logMessageCommonPart}`)
    }
  } catch (error) {
    logger.error(`error sending ${logMessageCommonPart}: ${error.message}`)
    throw error
  }
}

export const sendEmail = async ({ to, msgKey, msgParams = {}, i18n: i18nParam = null, lang = 'en' }) => {
  const i18n = i18nParam ?? (await i18nFactory.createI18nAsync(lang))

  const subject = i18n.t(`${msgKey}.subject`, msgParams)
  const html = i18n.t(`${msgKey}.body`, msgParams)

  return sendCustomEmail({ to, subject, html })
}
