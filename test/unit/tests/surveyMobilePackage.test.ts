import * as SurveyFile from '@core/survey/surveyFile'
import { SurveyMobilePackage } from '@core/survey/surveyMobilePackage'

const layer = (uuid: string, deleted = false) => ({
  uuid,
  props: { name: `${uuid}.geojson`, size: 10, type: SurveyFile.SurveyFileType.preloadedMapLayer, deleted },
})

const surveyInfo = (props: Record<string, unknown>) => ({ props })

describe('SurveyMobilePackage', () => {
  test('no files', () => {
    expect(SurveyMobilePackage.getFileSummaries(surveyInfo({}))).toEqual([])
  })

  test('preloaded map layers only when enabled, deleted ones excluded', () => {
    const props = { preloadedMapLayers: [layer('a'), layer('b', true)] }
    expect(SurveyMobilePackage.getFileSummaries(surveyInfo(props))).toEqual([])
    expect(SurveyMobilePackage.getFileSummaries(surveyInfo({ ...props, preloadedMapLayersEnabled: true }))).toEqual([
      { uuid: 'a', type: SurveyFile.SurveyFileType.preloadedMapLayer, name: 'a.geojson', size: 10 },
    ])
  })

  test('branding images', () => {
    const props = { branding: { surveyLogo1: { fileUuid: 'logo', name: 'logo.png', size: 5 } } }
    expect(SurveyMobilePackage.getFileSummaries(surveyInfo(props))).toEqual([
      { uuid: 'logo', type: SurveyFile.SurveyFileType.brandingSurveyLogo1, name: 'logo.png', size: 5 },
    ])
  })

  test('areas of interest', () => {
    const area = (name: string) => ({
      name,
      fileUuid: name,
      fileName: `${name}.geojson`,
      size: 100,
      polygons: 1,
      vertices: 5,
    })
    const props = { areasOfInterest: [area('area_a'), area('area_b')] }
    expect(SurveyMobilePackage.getFileSummaries(surveyInfo(props))).toEqual([
      { uuid: 'area_a', type: SurveyFile.SurveyFileType.areaOfInterest, name: 'area_a.geojson', size: 100 },
      { uuid: 'area_b', type: SurveyFile.SurveyFileType.areaOfInterest, name: 'area_b.geojson', size: 100 },
    ])
  })
})
