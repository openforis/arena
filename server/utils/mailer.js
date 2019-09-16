const aws = require('../system/aws')
const ProcessEnv = require('../system/processEnv')

const i18nFactory = require('../../common/i18n/i18nFactory')

const sendEmail = async (to, msgKey, msgParams = {}, lang) => {
  const i18n = await i18nFactory.createI18nPromise(lang)
  const mailSubject = i18n.t(`${msgKey}.subject`)
  const msgBody = i18n.t(`${msgKey}.body`, msgParams)

  await aws.sendEmail(ProcessUtils.ENV.adminEmail, to, mailSubject, msgBody)
}

module.exports = {
  sendEmail,
}
