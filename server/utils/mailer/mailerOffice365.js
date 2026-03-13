import * as nodemailer from 'nodemailer'

import * as ProcessUtils from '@core/processUtils'

import { assertRequiredEnvVars, assertResolvedFromAddress, assertTransportOptionsEnv } from './mailerProviderUtils'

const emailService = 'office365'
const authUser = ProcessUtils.ENV.emailAuthUser
const authPass = ProcessUtils.ENV.emailAuthPassword

const defaultTransportOptions = {
  host: 'smtp.office365.com',
  port: '587',
  auth: { user: authUser, pass: authPass },
  secure: true,
}

const getTransportOptions = () => ProcessUtils.ENV.emailTransportOptions ?? defaultTransportOptions

export const validateEnv = ({ from }) => {
  assertTransportOptionsEnv({ emailService })
  assertResolvedFromAddress({ emailService, from })

  if (!ProcessUtils.ENV.emailTransportOptions) {
    assertRequiredEnvVars({
      emailService,
      variables: [
        ['EMAIL_AUTH_USER', authUser],
        ['EMAIL_AUTH_PASSWORD', authPass],
      ],
    })
  }
}

export const logTransportOptionsType = () => (ProcessUtils.ENV.emailTransportOptions ? 'custom' : 'default')

export const sendEmail = async ({ to, from, subject, html, text = null }) => {
  const transporter = nodemailer.createTransport(getTransportOptions())

  await transporter.sendMail({
    from,
    to,
    replyTo: from,
    subject,
    html,
    text,
  })
}
