import React from 'react'
import ReCAPTCHA from 'react-google-recaptcha'

import * as ProcessUtils from '@core/processUtils'

export const ReCaptcha = React.forwardRef((_props, ref) => (
  <ReCAPTCHA ref={ref} sitekey={ProcessUtils.ENV.reCaptchaSiteKey} />
))
