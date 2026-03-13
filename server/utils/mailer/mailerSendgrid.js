import * as sgMail from '@sendgrid/mail'

import * as ProcessUtils from '@core/processUtils'

import { assertRequiredEnvVars, assertResolvedFromAddress } from './mailerProviderUtils'

const emailService = 'sendgrid'
const apiKey = ProcessUtils.ENV.sendGridApiKey

export const validateEnv = ({ from }) => {
  assertRequiredEnvVars({ emailService, variables: [['SENDGRID_API_KEY', apiKey]] })
  assertResolvedFromAddress({ emailService, from })
}

export const init = () => {
  sgMail.setApiKey(apiKey)
}

export const sendEmail = async ({ to, from, subject, html }) => {
  if (Array.isArray(to)) {
    await sgMail.sendMultiple({ to, from, subject, html })
  } else {
    await sgMail.send({ to, from, subject, html })
  }
}
