const aws = require('../system/aws')

const sendEmail = async (to, msgKey, msgParams = {}, i18n) => {
  const mailSubject = i18n.t(`${msgKey}.subject`)
  const msgBody = i18n.t(`${msgKey}.body`, msgParams)
  await aws.sendEmail(process.env.ADMIN_EMAIL, to, mailSubject, msgBody)
}

module.exports = {
  sendEmail,
}
