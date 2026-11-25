import * as NodeDef from '@core/survey/nodeDef'

import { getMapLayerCardModel } from '@webapp/components/ai/Assistant/analysis/mapLayerCardModel'
import { fitLayerBounds } from '@webapp/views/Data/MapView/GeoAttributeDataLayer/fitLayerBounds'

import * as DataTest from '../../utils/dataTest'
import * as SurveyUtils from '../../utils/surveyUtils'
import { getContextUser } from '../../integration/config/context'

let survey: any = null
const getUuid = (path: string) => NodeDef.getUuid(SurveyUtils.getNodeDefByPath({ survey, path }))

beforeAll(async () => {
  survey = await DataTest.createTestSurvey({ user: getContextUser() })
})

describe('map layer card model', () => {
  const model = (attributeUuid: string | null, canUseMap = true, search: string | null = null) =>
    getMapLayerCardModel({
      proposed: { attributeUuid, attribute: 'x', search, explanation: 'Why', shownToUser: true },
      survey,
      lang: 'en',
      canUseMap,
    })

  test('a coordinate attribute is ok with its label', () => {
    const uuid = getUuid('cluster/plot/plot_location')
    const result = model(uuid)
    expect(result.status).toBe('ok')
    expect(result.label).toBe(
      NodeDef.getLabel(SurveyUtils.getNodeDefByPath({ survey, path: 'cluster/plot/plot_location' }), 'en')
    )
    expect(result.label).toBeTruthy()
    expect(result.uuid).toBe(uuid)
    expect(result.explanation).toBe('Why')
  })

  test('layer plus search keeps the search', () => {
    const result = model(getUuid('cluster/plot/plot_location'), true, 'EP')
    expect(result.status).toBe('ok')
    expect(result.search).toBe('EP')
  })

  test('coordinates only is ok without label or uuid', () => {
    expect(model(null, true, '41,12')).toMatchObject({ status: 'ok', label: null, uuid: null, search: '41,12' })
  })

  test('coordinates only without permission', () => {
    expect(model(null, false).status).toBe('noPermission')
  })

  test('a deleted attribute with a search is missing', () => {
    expect(model('00000000-0000-0000-0000-000000000000', true, 'EP').status).toBe('missing')
  })

  test('an unknown uuid is missing', () => {
    expect(model('00000000-0000-0000-0000-000000000000').status).toBe('missing')
  })

  test('a non-geo attribute is missing', () => {
    expect(model(getUuid('cluster/cluster_id')).status).toBe('missing')
  })

  test('without map permission the card says so', () => {
    expect(model(getUuid('cluster/plot/plot_location'), false).status).toBe('noPermission')
  })
})

describe('fitLayerBounds', () => {
  test('no points: false and the map is left alone', () => {
    const map: any = { fitBounds: jest.fn() }
    expect(fitLayerBounds(map, [])).toBe(false)
    expect(map.fitBounds).not.toHaveBeenCalled()
  })

  test('points: fits them', () => {
    const map: any = { fitBounds: jest.fn() }
    const points: Array<{ geometry: { coordinates: [number, number] } }> = [
      { geometry: { coordinates: [12, 41] } },
      { geometry: { coordinates: [13, 42] } },
    ]
    expect(fitLayerBounds(map, points)).toBe(true)
    expect(map.fitBounds).toHaveBeenCalledTimes(1)
    expect(map.fitBounds.mock.calls[0][0]).toEqual([
      [41, 12],
      [42, 13],
    ])
    expect(map.fitBounds.mock.calls[0][1]).toEqual({ padding: [32, 32], maxZoom: 16 })
  })
})
