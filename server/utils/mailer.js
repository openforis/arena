import * as sgMail from '@sendgrid/mail'
import * as nodemailer from 'nodemailer'

import * as ProcessUtils from '@core/processUtils'
import * as i18nFactory from '@core/i18n/i18nFactory'

import * as Log from '@server/log/log'

const logger = Log.getLogger('Mailer')

const emailServices = {
  sendgrid: 'sendgrid',
  office365: 'office365',
  amazonSES: 'amazonSES',
}

const emailService = ProcessUtils.ENV.emailService

logger.debug(`using ${emailService} email service`)

if (emailService === emailServices.sendgrid) {
  const sendGridApiKey = ProcessUtils.ENV.sendGridApiKey
  if (!sendGridApiKey) {
    throw new Error('SENDGRID_API_KEY environment variable is required when using SendGrid email service')
  }
  sgMail.setApiKey(sendGridApiKey)
}

const authUser = ProcessUtils.ENV.emailAuthUser
const authPass = ProcessUtils.ENV.emailAuthPassword
const from = ProcessUtils.ENV.emailFrom || ProcessUtils.ENV.adminEmail || authUser

const defaultOffice365TransportOptions = {
  host: 'smtp.office365.com',
  port: '587',
  auth: { user: authUser, pass: authPass },
  secure: true,
  tls: { ciphers: 'SSLv3' },
}

const defaultAmazonSESTransportOptions = {
  host: ProcessUtils.ENV.emailAmazonSESHost,
  port: ProcessUtils.ENV.emailAmazonSESPort,
  auth: { user: authUser, pass: authPass },
  secure: true,
  requireTLS: true,
  tls: {
    port: 465,
    rejectUnauthorized: true,
  },
}

let office365TransportOptions = null
let amazonSESTransportOptions = null
{
  const optionsType = ProcessUtils.ENV.emailTransportOptions ? 'custom' : 'default'
  logger.debug(`using ${optionsType} email transport options`)
  switch (emailService) {
    case emailServices.office365:
      office365TransportOptions = ProcessUtils.ENV.emailTransportOptions ?? defaultOffice365TransportOptions
      // logger.debug(`Office365 transport config: ${JSON.stringify(office365TransportOptions)}`)
      break
    case emailServices.amazonSES:
      amazonSESTransportOptions = ProcessUtils.ENV.emailTransportOptions ?? defaultAmazonSESTransportOptions
      // logger.debug(`Amazon SES transport config: ${JSON.stringify(amazonSESTransportOptions)}`)
      break
  }
}

const sendEmailSendgrid = async ({ to, subject, html }) => {
  if (Array.isArray(to)) {
    await sgMail.sendMultiple({ to, from, subject, html })
  } else {
    await sgMail.send({ to, from, subject, html })
  }
}

const sendEmailMSOffice365 = async ({ to, subject, html, text = null }) => {
  const transporter = nodemailer.createTransport(office365TransportOptions)

  await transporter.sendMail({
    from,
    to,
    replyTo: from,
    subject,
    html,
    text,
  })
}

const sendEmailAmazonSES = async ({ to, subject, html, text = null }) => {
  const transporter = nodemailer.createTransport(amazonSESTransportOptions)

  await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text,
  })
}

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
    switch (emailService) {
      case emailServices.sendgrid:
        await sendEmailSendgrid({ to, subject, html })
        break
      case emailServices.office365:
        await sendEmailMSOffice365({ to, subject, html })
        break
      case emailServices.amazonSES:
        await sendEmailAmazonSES({ to, subject, html })
        break
      default:
        throw new Error('Invalid email service specified: ' + emailService)
    }
    if (log) {
      logger.debug(`sent ${logMessageCommonPart}`)
    }
  } catch (error) {
    logger.error(`error sending ${logMessageCommonPart}: ${error.message}`)
    throw error
  }
}

export const sendEmail = async ({ to, msgKey, msgParams = {}, i18n: i18nParam = null, lang = 'en' }) => {
  const i18n = i18nParam ? i18nParam : await i18nFactory.createI18nAsync(lang)

  const subject = i18n.t(`${msgKey}.subject`, msgParams)
  const html = i18n.t(`${msgKey}.body`, msgParams)

  return sendCustomEmail({ to, subject, html })
}
