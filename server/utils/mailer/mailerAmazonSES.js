import * as nodemailer from 'nodemailer'

import * as ProcessUtils from '@core/processUtils'

import {
  assertNumericEnvVar,
  assertRequiredEnvVars,
  assertResolvedFromAddress,
  assertTransportOptionsEnv,
} from './mailerProviderUtils'

const emailService = 'amazonSES'
const authUser = ProcessUtils.ENV.emailAuthUser
const authPass = ProcessUtils.ENV.emailAuthPassword

const defaultTransportOptions = {
  host: ProcessUtils.ENV.emailAmazonSESHost,
  port: ProcessUtils.ENV.emailAmazonSESPort,
  auth: { user: authUser, pass: authPass },
  secure: true,
}

const getTransportOptions = () => ProcessUtils.ENV.emailTransportOptions ?? defaultTransportOptions

export const validateEnv = ({ from }) => {
  assertTransportOptionsEnv({ emailService })
  assertResolvedFromAddress({ emailService, from })
  assertNumericEnvVar({ emailService, variableName: 'EMAIL_AMAZON_SES_PORT' })

  if (!ProcessUtils.ENV.emailTransportOptions) {
    assertRequiredEnvVars({
      emailService,
      variables: [
        ['EMAIL_AUTH_USER', authUser],
        ['EMAIL_AUTH_PASSWORD', authPass],
        ['EMAIL_AMAZON_SES_HOST', ProcessUtils.ENV.emailAmazonSESHost],
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
    subject,
    html,
    text,
  })
}
