import * as AuthGroup from '@core/auth/authGroup'
import * as RecordStep from '@core/record/recordStep'
import * as Survey from '@core/survey/survey'

/**
 * Checks whether any survey auth group can act on the cleansing record step.
 *
 * @param {unknown} surveyInfo - The survey info.
 * @returns {boolean} True if at least one auth group includes the cleansing step.
 */
export const surveyIncludesCleansingStep = (surveyInfo: unknown): boolean => {
  const groups: unknown[] = Survey.getAuthGroups(surveyInfo) ?? []
  for (const group of groups) {
    const steps: unknown = AuthGroup.getRecordSteps(group)
    // default value of recordSteps is an array: no steps defined
    if (steps && !Array.isArray(steps) && RecordStep.cleansingCode in (steps as Record<string, unknown>)) {
      return true
    }
  }
  return false
}
