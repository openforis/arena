import * as sgMail from '@sendgrid/mail'

import { ArrayUtils } from '@core/arrayUtils'
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
  const toRecipients = ArrayUtils.toArray(to)
  // SendGrid rejects a message having the same address both in "to" and "bcc"
  const bccRecipients = ArrayUtils.toArray(bcc).filter((recipient) => !toRecipients.includes(recipient))

  if (toRecipients.length === 1) {
    await sgMail.send({
      to: toRecipients[0],
      bcc: bccRecipients.length > 0 ? bccRecipients : undefined,
      from,
      subject,
      html,
    })
  } else {
    // multiple (or no) "to" recipients: sendMultiple sends a separate message to each recipient,
    // so that recipients cannot see each other's addresses; bcc recipients get their own separate messages
    // (passing bcc to sendMultiple would send a copy of every message to each bcc recipient)
    if (toRecipients.length > 0) {
      await sgMail.sendMultiple({ to: toRecipients, from, subject, html })
    }
    if (bccRecipients.length > 0) {
      await sgMail.sendMultiple({ to: bccRecipients, from, subject, html })
    }
  }
  // SendGrid accepts the message via API immediately; it cannot report an invalid recipient synchronously
  // (bounces are reported later, asynchronously, via webhooks that are not handled here).
  return { accepted: [...toRecipients, ...bccRecipients], rejected: [] }
}
