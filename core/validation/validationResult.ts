import { ValidationResult, ValidationResults, ValidationSeverity } from '@openforis/arena-core'
export { ValidationSeverity as severity } from '@openforis/arena-core'

export const keys = {
  key: 'key',
  params: 'params',
  severity: 'severity',
  messages: 'messages',

  customErrorMessageKey: 'custom',
} as const

export type Severity = ValidationSeverity

export type ValidationResultInstance = ValidationResult

export const newInstance = (
  key: string,
  params: Record<string, unknown> | null = null,
  sev: ValidationSeverity | null = null,
  messages: Record<string, string> | null = null
): ValidationResultInstance => {
  const result: ValidationResult = {
    key,
    valid: false,
  }
  if (params) {
    result.params = params
  }
  if (sev) {
    result.severity = sev
  }
  if (messages) {
    result.messages = messages
  }
  return result
}

export const { getKey, getParams, getSeverity, getMessages, getMessage, hasMessages, isError } = ValidationResults
