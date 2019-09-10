const aws = require('../system/aws')

const i18n = require('../system/i18n')

const sendEmail = async (to, msgKey, msgParams = {}, lang) => {
  i18n.translate(async t => {
    const mailSubject = t(`${msgKey}.subject`)
    const msgBody = t(`${msgKey}.body`, msgParams)
    await aws.sendEmail(process.env.ADMIN_EMAIL, to, mailSubject, msgBody)
  })
}

module.exports = {
  sendEmail,
}
