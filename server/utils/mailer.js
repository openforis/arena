import * as sgMail from '@sendgrid/mail'

import * as ProcessUtils from '@core/processUtils'
import * as i18nFactory from '@core/i18n/i18nFactory'

sgMail.setApiKey(ProcessUtils.ENV.sendGridApiKey)

export const sendEmail = async ({ to, msgKey, msgParams = {}, i18n: i18nParam = null, lang = 'en' }) => {
  const i18n = i18nParam ? i18nParam : await i18nFactory.createI18nAsync(lang)

  const from = ProcessUtils.ENV.adminEmail
  const subject = i18n.t(`${msgKey}.subject`, msgParams)
  const html = i18n.t(`${msgKey}.body`, msgParams)

  if (Array.isArray(to)) {
    await sgMail.sendMultiple({ to, from, subject, html })
  } else {
    await sgMail.send({ to, from, subject, html })
  }
}
