const aws = require('../system/aws')

export const sendEmail = async (to, msgKey, msgParams = {}) => {
  await aws.sendEmail('from_email', to, 'test', 'test')
}

sendEmail()
