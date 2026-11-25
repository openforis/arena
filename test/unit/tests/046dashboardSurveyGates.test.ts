import type { ArenaSurvey } from '@openforis/arena-core'
import * as NodeDef from '@core/survey/nodeDef'
import * as RecordStep from '@core/record/recordStep'
import { surveyIncludesCleansingStep } from '@webapp/views/Dashboard/utils/surveyIncludesCleansingStep'
import { surveyHasGeoAttributes } from '@webapp/views/Dashboard/utils/surveyHasGeoAttributes'

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

describe('surveyHasGeoAttributes', () => {
  it('detects geo node defs', () => {
    const survey = {
      nodeDefs: {
        a: { uuid: 'a', type: NodeDef.nodeDefType.geo },
        b: { uuid: 'b', type: NodeDef.nodeDefType.text },
      },
    } as unknown as ArenaSurvey
    expect(surveyHasGeoAttributes(survey)).toBe(true)
  })

  it('returns false without geo defs', () => {
    const survey = { nodeDefs: { b: { uuid: 'b', type: NodeDef.nodeDefType.text } } } as unknown as ArenaSurvey
    expect(surveyHasGeoAttributes(survey)).toBe(false)
  })

  it('returns false when the survey has no node defs', () => {
    expect(surveyHasGeoAttributes({} as unknown as ArenaSurvey)).toBe(false)
  })

  it('ignores coordinate attributes', () => {
    const survey = { nodeDefs: { c: { uuid: 'c', type: NodeDef.nodeDefType.coordinate } } } as unknown as ArenaSurvey
    expect(surveyHasGeoAttributes(survey)).toBe(false)
  })
})
