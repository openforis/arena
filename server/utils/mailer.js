import * as sgMail from '@sendgrid/mail'
import * as nodemailer from 'nodemailer'

import * as ProcessUtils from '@core/processUtils'
import * as i18nFactory from '@core/i18n/i18nFactory'

import * as Log from '@server/log/log'

const logger = Log.getLogger('Mailer')

const emailServices = {
  sendgrid: 'sendgrid',
  office365: 'office365',
}

const emailService = ProcessUtils.ENV.emailService

if (emailService === emailServices.sendgrid) {
  sgMail.setApiKey(ProcessUtils.ENV.sendGridApiKey)
}

const authUser = ProcessUtils.ENV.emailAuthUser
const authPass = ProcessUtils.ENV.emailAuthPassword
const from = ProcessUtils.ENV.adminEmail || authUser

const defaultTransportOptions = {
  host: 'smtp.office365.com',
  port: '587',
  auth: { user: authUser, pass: authPass },
  secure: true,
  tls: { ciphers: 'SSLv3' },
}

let transportOptions = null
{
  const optionsType = ProcessUtils.ENV.emailTransportOptions ? 'custom' : 'default'
  logger.debug(`using ${optionsType} email transport options`)
  transportOptions = ProcessUtils.ENV.emailTransportOptions ?? defaultTransportOptions
}

const sendEmailSendgrid = async ({ to, subject, html }) => {
  if (Array.isArray(to)) {
    await sgMail.sendMultiple({ to, from, subject, html })
  } else {
    await sgMail.send({ to, from, subject, html })
  }
}

const sendEmailMSOffice365 = async ({ to, subject, html, text = null }) => {
  const mailTransport = nodemailer.createTransport(transportOptions)

  await mailTransport.sendMail({
    from,
    to,
    replyTo: from,
    subject,
    html,
    text,
  })
}

export const sendEmail = async ({ to, msgKey, msgParams = {}, i18n: i18nParam = null, lang = 'en' }) => {
  const i18n = i18nParam ? i18nParam : await i18nFactory.createI18nAsync(lang)

  const subject = i18n.t(`${msgKey}.subject`, msgParams)
  const html = i18n.t(`${msgKey}.body`, msgParams)

  if (emailService === emailServices.sendgrid) {
    await sendEmailSendgrid({ to, subject, html })
  } else if (emailService === emailServices.office365) {
    await sendEmailMSOffice365({ to, subject, html })
  } else {
    throw new Error('Invalid email service specified: ' + emailService)
  }
}
