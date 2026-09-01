import { Objects } from '@openforis/arena-core'

import * as ProcessUtils from '@core/processUtils'

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0

export const assertRequiredEnvVars = ({ emailService, variables }) => {
  const missingVariables = variables.filter(([, value]) => Objects.isEmpty(value)).map(([name]) => name)

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required environment variables for ${emailService} email service: ${missingVariables.join(', ')}`
    )
  }
}

export const assertTransportOptionsEnv = ({ emailService }) => {
  const hasTransportOptionsEnv = Objects.isNotEmpty(process.env.EMAIL_TRANSPORT_OPTIONS)
  const transportOptions = ProcessUtils.ENV.emailTransportOptions

  if (hasTransportOptionsEnv && !transportOptions) {
    throw new Error(`Invalid EMAIL_TRANSPORT_OPTIONS for ${emailService} email service: expected valid JSON`)
  }

  if (transportOptions && (typeof transportOptions !== 'object' || Array.isArray(transportOptions))) {
    throw new Error(`Invalid EMAIL_TRANSPORT_OPTIONS for ${emailService} email service: expected a JSON object`)
  }
}

export const assertResolvedFromAddress = ({ emailService, from }) => {
  if (Objects.isEmpty(from)) {
    throw new Error(
      `Missing sender email for ${emailService} email service: set EMAIL_FROM, ADMIN_EMAIL, or the provider auth user`
    )
  }
}

export const assertNumericEnvVar = ({ emailService, variableName }) => {
  const rawValue = process.env[variableName]

  if (isNonEmptyString(rawValue) && Number.isNaN(Number(rawValue))) {
    throw new Error(`Invalid ${variableName} for ${emailService} email service: expected a numeric value`)
  }
}
