import * as RecordStep from '@core/record/recordStep'
import { surveyIncludesCleansingStep } from '@webapp/views/App/views/Dashboard/utils/surveyIncludesCleansingStep'

describe('surveyIncludesCleansingStep', () => {
  it('returns true when an auth group has cleansing step', () => {
    const surveyInfo = {
      authGroups: [{ recordSteps: { [RecordStep.entryCode]: 'own', [RecordStep.cleansingCode]: 'all' } }],
    }
    expect(surveyIncludesCleansingStep(surveyInfo)).toBe(true)
  })

  it('returns false when no group has cleansing step', () => {
    const surveyInfo = {
      authGroups: [{ recordSteps: { [RecordStep.entryCode]: 'own' } }],
    }
    expect(surveyIncludesCleansingStep(surveyInfo)).toBe(false)
  })
})
