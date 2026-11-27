import axios from 'axios'

import * as ProcessUtils from '@core/processUtils'
import * as Log from '@server/log/log'

const logger = Log.getLogger('ReCaptchaUtils')

const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify'

/**
 * Verifies a reCAPTCHA token (always true when reCAPTCHA is disabled); false also when Google cannot be reached.
 */
const verifyReCaptcha = async ({ token }: { token?: string | null }): Promise<boolean> => {
  if (!ProcessUtils.ENV.reCaptchaEnabled) {
    return true
  }
  if (!token || typeof token !== 'string') {
    return false
  }
  try {
    // secret and token in the body, not in the URL (kept in proxy logs)
    const body = new URLSearchParams({ secret: ProcessUtils.ENV.reCaptchaSecretKey ?? '', response: token })
    const { data } = await axios.post(verifyUrl, body)
    return data?.success === true
  } catch (error) {
    logger.error(`reCAPTCHA verification failed: ${error?.message ?? error}`)
    return false
  }
}

export const ReCaptchaUtils = {
  verifyReCaptcha,
}
