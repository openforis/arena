import type { RecordExpressionEvaluationContext } from '@openforis/arena-core'

/**
 * Parameters needed to evaluate the survey expressions (relevance, default values, validations...)
 * while updating or validating a record: forward them all, using extract, to keep them in sync.
 */
export type RecordEvaluationContext = Omit<
  RecordExpressionEvaluationContext,
  'record' | 'prevCycleRecord' | 'sideEffect'
>

const keys: (keyof RecordEvaluationContext)[] = [
  'user',
  'survey',
  'categoryItemProvider',
  'taxonProvider',
  'areaOfInterestProvider',
  'timezoneOffset',
  'lang',
]

const extract = (params: Record<string, any>): RecordEvaluationContext => {
  const context: Record<string, any> = {}
  for (const key of keys) {
    if (params[key] !== undefined && params[key] !== null) {
      context[key] = params[key]
    }
  }
  return context as RecordEvaluationContext
}

export const RecordEvaluationContext = {
  keys,
  extract,
}
