import * as sgMail from '@sendgrid/mail'

import * as ProcessUtils from '@core/processUtils'
import * as i18nFactory from '@core/i18n/i18nFactory'

sgMail.setApiKey(ProcessUtils.ENV.sendGridApiKey)

export const sendEmail = async (to, msgKey, msgParams, lang) => {
  const i18n = await i18nFactory.createI18nPromise(lang)

  const from = ProcessUtils.ENV.adminEmail
  const subject = i18n.t(`${msgKey}.subject`)
  const html = i18n.t(`${msgKey}.body`, msgParams || {})

  await sgMail.send({
    to,
    from,
    subject,
    html,
  })
}
