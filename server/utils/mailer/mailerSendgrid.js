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

export const sendEmail = async ({ to = null, bcc = null, from, subject, html }) => {
  if (!to && bcc) {
    // SendGrid requires a "to" recipient: send a separate message to each bcc recipient,
    // so that recipients cannot see each other's addresses
    const bccRecipients = Array.isArray(bcc) ? bcc : [bcc]
    await sgMail.sendMultiple({ to: bccRecipients, from, subject, html })
    return { accepted: bccRecipients, rejected: [] }
  }
  if (Array.isArray(to)) {
    await sgMail.sendMultiple({ to, from, subject, html })
  } else {
    await sgMail.send({ to, bcc: bcc ?? undefined, from, subject, html })
  }
  // SendGrid accepts the message via API immediately; it cannot report an invalid recipient synchronously
  // (bounces are reported later, asynchronously, via webhooks that are not handled here).
  return { accepted: Array.isArray(to) ? to : [to], rejected: [] }
}
