import type { AreaOfInterest } from '@openforis/arena-core'

import * as SurveyAreaOfInterest from '@core/survey/surveyAreaOfInterest'
import { SurveyAreaOfInterestValidator } from '@core/survey/surveyAreaOfInterestValidator'
import * as Validation from '@core/validation/validation'

const square: AreaOfInterest = {
  type: 'Polygon',
  coordinates: [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ],
  ],
}

const newDescriptor = (name: string, fileUuid: string) =>
  SurveyAreaOfInterest.newAreaOfInterestDescriptor({
    name,
    labels: { en: name },
    fileUuid,
    fileName: `${name}.geojson`,
    size: 100,
    areaOfInterest: square,
  })

const validate = async (otherAreas: ReturnType<typeof newDescriptor>[], areaOfInterest: object) =>
  Validation.isValid(await SurveyAreaOfInterestValidator.validate({ areasOfInterest: otherAreas, areaOfInterest }))

describe('SurveyAreaOfInterest', () => {
  const areaA = newDescriptor('area_a', 'uuid-a')
  const areaB = newDescriptor('area_b', 'uuid-b')
  const surveyInfo = { props: { areasOfInterest: [areaA, areaB] } }

  test('descriptor with summary', () => {
    expect(areaA).toEqual({
      name: 'area_a',
      labels: { en: 'area_a' },
      fileUuid: 'uuid-a',
      fileName: 'area_a.geojson',
      size: 100,
      polygons: 1,
      vertices: 5,
    })
  })

  test('getters', () => {
    expect(SurveyAreaOfInterest.getAreasOfInterest(surveyInfo)).toEqual([areaA, areaB])
    expect(SurveyAreaOfInterest.getAreaOfInterestNames(surveyInfo)).toEqual(['area_a', 'area_b'])
    expect(SurveyAreaOfInterest.getAreaOfInterestFileUuids(surveyInfo)).toEqual(['uuid-a', 'uuid-b'])
    expect(SurveyAreaOfInterest.getAreaOfInterestFileSummaries(surveyInfo)[1]).toEqual({
      uuid: 'uuid-b',
      props: { type: 'areaOfInterest', name: 'area_b.geojson', size: 100 },
    })
    expect(SurveyAreaOfInterest.getAreasOfInterest({ props: {} })).toEqual([])
  })

  test('validation', async () => {
    expect(await validate([areaA, areaB], newDescriptor('area_c', 'uuid-c'))).toBe(true)
    // edited area: the other areas only
    expect(await validate([areaB], newDescriptor('area_a', 'uuid-a2'))).toBe(true)
    expect(await validate([areaA, areaB], newDescriptor('area_a', 'uuid-c'))).toBe(false)
    expect(await validate([areaA], newDescriptor('Area A', 'uuid-c'))).toBe(false)
    expect(await validate([areaA], newDescriptor('length', 'uuid-c'))).toBe(false)
    expect(await validate([areaA], { ...newDescriptor('', 'uuid-c') })).toBe(false)
    expect(await validate([areaA], { name: 'area_c' })).toBe(false)
  })
})
