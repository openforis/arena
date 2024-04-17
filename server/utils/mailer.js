import * as sgMail from '@sendgrid/mail'
import * as nodemailer from 'nodemailer'

import * as ProcessUtils from '@core/processUtils'
import * as i18nFactory from '@core/i18n/i18nFactory'

sgMail.setApiKey(ProcessUtils.ENV.sendGridApiKey)

const from = ProcessUtils.ENV.adminEmail
const pass = ProcessUtils.ENV.adminPassword

const sendEmailSendgrid = async ({ to, subject, html }) => {
  if (Array.isArray(to)) {
    await sgMail.sendMultiple({ to, from, subject, html })
  } else {
    await sgMail.send({ to, from, subject, html })
  }
}

const sendEmailMSOffice365 = async ({ to, subject, html, text = null }) => {
  try {
    const transportOptions = {
      host: 'smtp.office365.com',
      port: '587',
      auth: { user: from, pass },
      secureConnection: true,
      tls: { ciphers: 'SSLv3' },
    }

    const mailTransport = nodemailer.createTransport(transportOptions)

    await mailTransport.sendMail({
      from,
      to,
      replyTo: from,
      subject,
      html,
      text,
    })
  } catch (error) {
    console.log('---error', error)
  }
}

export const sendEmail = async ({ to, msgKey, msgParams = {}, i18n: i18nParam = null, lang = 'en' }) => {
  const i18n = i18nParam ? i18nParam : await i18nFactory.createI18nAsync(lang)

  const subject = i18n.t(`${msgKey}.subject`, msgParams)
  const html = i18n.t(`${msgKey}.body`, msgParams)

  // await sendEmailSendgrid({ to, subject, html })
  await sendEmailMSOffice365({ to, subject, html })
}
