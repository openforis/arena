import axios from 'axios'

import * as ProcessUtils from '@core/processUtils'

const verifyReCaptcha = async ({ token }) => {
  // Making POST request to verify captcha
  const { data } = await axios.post(
    `https://www.google.com/recaptcha/api/siteverify?secret=${ProcessUtils.ENV.reCaptchaSecretKey}&response=${token}`
  )
  const { success } = data
  return success === true
}

export const ReCaptchaUtils = {
  verifyReCaptcha,
}
