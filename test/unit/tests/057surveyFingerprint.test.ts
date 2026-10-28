import * as Survey from '@core/survey/survey'
import { SurveyFingerprintType, buildSurveyFingerprintContent } from '@core/survey/surveyCompare'

import {
  addAttribute,
  buildSurvey,
  clone,
  itemsByCategoryUuid,
  markAllPublished,
  setValidationExpression,
  updateNodeDef,
} from '../../utils/surveyCompareTestUtils'

const withAreaOfInterestFile = ({ survey, fileUuid, vertices = 5 }) => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  const areaOfInterestFile = { fileUuid, name: 'aoi.geojson', size: 100, polygons: 1, vertices }
  return { ...survey, info: { ...surveyInfo, props: { ...surveyInfo.props, areaOfInterestFile } } }
}

const fingerprint = ({ survey, items, type }) =>
  buildSurveyFingerprintContent({ survey, itemsByCategoryUuid: itemsByCategoryUuid(survey, items), type })

const fingerprints = ({ survey, items }) => ({
  strict: fingerprint({ survey, items, type: SurveyFingerprintType.strict }),
  structural: fingerprint({ survey, items, type: SurveyFingerprintType.structural }),
})

describe('Survey fingerprint', () => {
  test('a copy of a survey has the same fingerprints', async () => {
    const { survey, items } = await buildSurvey()
    expect(fingerprints({ survey: clone(survey), items: clone(items) })).toEqual(fingerprints({ survey, items }))
  })

  test('publishing status is not part of the fingerprint', async () => {
    const { survey, items } = await buildSurvey()
    expect(fingerprints({ survey: markAllPublished(clone(survey)), items })).toEqual(fingerprints({ survey, items }))
  })

  test('surveys built separately have the same structural fingerprint only', async () => {
    const surveyA = await buildSurvey()
    const surveyB = await buildSurvey()
    const fingerprintsA = fingerprints(surveyA)
    const fingerprintsB = fingerprints(surveyB)
    expect(fingerprintsB.structural).toEqual(fingerprintsA.structural)
    expect(fingerprintsB.strict).not.toEqual(fingerprintsA.strict)
  })

  test('the area of interest is part of the fingerprints, its file uuid is not', async () => {
    const { survey, items } = await buildSurvey()
    const original = fingerprints({ survey: withAreaOfInterestFile({ survey, fileUuid: 'aoi-1' }), items })
    expect(fingerprints({ survey: withAreaOfInterestFile({ survey, fileUuid: 'aoi-2' }), items })).toEqual(original)
    expect(fingerprints({ survey, items }).structural).not.toEqual(original.structural)
    expect(
      fingerprints({ survey: withAreaOfInterestFile({ survey, fileUuid: 'aoi-1', vertices: 7 }), items }).structural
    ).not.toEqual(original.structural)
  })

  test('a change in the definition changes both fingerprints', async () => {
    const { survey, items } = await buildSurvey()
    const surveyChanged = updateNodeDef({
      survey: clone(survey),
      name: 'dbh',
      updateFn: setValidationExpression('dbh > 0'),
    })
    const original = fingerprints({ survey, items })
    const changed = fingerprints({ survey: surveyChanged, items })
    expect(changed.strict).not.toEqual(original.strict)
    expect(changed.structural).not.toEqual(original.structural)

    const { survey: surveyWithHeight } = await addAttribute({
      survey: clone(survey),
      parentName: 'tree',
      name: 'height',
    })
    expect(fingerprints({ survey: surveyWithHeight, items }).structural).not.toEqual(original.structural)
  })

  test('a change in a category item changes the fingerprints', async () => {
    const { survey, items } = await buildSurvey()
    const [firstItem, ...otherItems] = items
    const itemsChanged = [{ ...firstItem, props: { ...firstItem.props, labels: { en: 'Changed' } } }, ...otherItems]
    expect(fingerprints({ survey, items: itemsChanged }).structural).not.toEqual(
      fingerprints({ survey, items }).structural
    )
  })
})
