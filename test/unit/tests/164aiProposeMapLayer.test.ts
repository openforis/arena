import * as NodeDef from '@core/survey/nodeDef'

import { getProposedMapLayer, proposeMapLayerTool } from '@webapp/ai/tools/analysis/proposeMapLayer'

import { newAnalysisToolContext, runTool, userWithoutAccess } from '@test/unit/utils/aiAnalysisTestUtils'

import * as DataTest from '../../utils/dataTest'
import * as SurveyUtils from '../../utils/surveyUtils'
import { getContextUser } from '../../integration/config/context'

let survey: any = null
const getUuid = (path: string) => NodeDef.getUuid(SurveyUtils.getNodeDefByPath({ survey, path }))

beforeAll(async () => {
  survey = await DataTest.createTestSurvey({ user: getContextUser() })
})

describe('map_proposeLayer', () => {
  const valid = () => ({
    attributeUuid: getUuid('cluster/plot/plot_location'),
    attribute: 'plot_location',
    search: null,
    explanation: 'Plots',
    shownToUser: true,
  })

  test('a coordinate attribute is proposed', async () => {
    const result = await runTool(
      proposeMapLayerTool,
      { attribute: 'plot_location', explanation: 'Plots' },
      newAnalysisToolContext({ survey })
    )
    expect(result).toEqual(valid())
  })

  test('a non-geo attribute is refused with the valid layers', async () => {
    const result: any = await runTool(
      proposeMapLayerTool,
      { attribute: 'cluster_id', explanation: 'x' },
      newAnalysisToolContext({ survey })
    )
    expect(result.error.code).toBe('invalidProposal')
    expect(result.error.layers).toEqual(expect.arrayContaining(['cluster_location', 'plot_location']))
  })

  test('an unknown attribute is refused', async () => {
    const result: any = await runTool(
      proposeMapLayerTool,
      { attribute: 'nope', explanation: 'x' },
      newAnalysisToolContext({ survey })
    )
    expect(result.error.code).toBe('invalidProposal')
  })

  test('a record search is passed through', async () => {
    const result = await runTool(
      proposeMapLayerTool,
      { attribute: 'plot_location', search: 'EP', explanation: 'Plots' },
      newAnalysisToolContext({ survey })
    )
    expect(result).toEqual({ ...valid(), search: 'EP' })
  })

  test('coordinates alone are accepted', async () => {
    const result = await runTool(
      proposeMapLayerTool,
      { search: '41.9, 12.5', explanation: 'x' },
      newAnalysisToolContext({ survey })
    )
    expect(result).toEqual({
      attributeUuid: null,
      attribute: null,
      search: '41.9, 12.5',
      explanation: 'x',
      shownToUser: true,
    })
  })

  test('a text search without attribute is refused with the layers', async () => {
    const result: any = await runTool(
      proposeMapLayerTool,
      { search: 'EP', explanation: 'x' },
      newAnalysisToolContext({ survey })
    )
    expect(result.error.code).toBe('invalidProposal')
    expect(result.error.layers).toEqual(expect.arrayContaining(['plot_location']))
  })

  test('nothing to show is refused', async () => {
    const result: any = await runTool(proposeMapLayerTool, { explanation: 'x' }, newAnalysisToolContext({ survey }))
    expect(result.error.code).toBe('invalidProposal')
  })

  test('invalid coordinates are refused', async () => {
    const result: any = await runTool(
      proposeMapLayerTool,
      { search: '95, 12', explanation: 'x' },
      newAnalysisToolContext({ survey })
    )
    expect(result.error.code).toBe('invalidProposal')
    expect(result.error.message).toMatch(/coordinates/)
  })

  test('a blank search is no search', async () => {
    const result = await runTool(
      proposeMapLayerTool,
      { attribute: 'plot_location', search: '  ', explanation: 'Plots' },
      newAnalysisToolContext({ survey })
    )
    expect(result).toEqual(valid())
  })

  test('a layer with invalid coordinates as search is refused', async () => {
    const result: any = await runTool(
      proposeMapLayerTool,
      { attribute: 'plot_location', search: '95, 12', explanation: 'x' },
      newAnalysisToolContext({ survey })
    )
    expect(result.error.code).toBe('invalidProposal')
    expect(result.error.message).toMatch(/coordinates/)
  })

  test('getProposedMapLayer fills old and coordinate-only outputs', () => {
    const toolName = 'map_proposeLayer'
    const old = { attributeUuid: 'u', attribute: 'a', explanation: 'e', shownToUser: true }
    expect(getProposedMapLayer({ toolName, output: old })).toEqual({ ...old, search: null })
    const coords = { attributeUuid: null, attribute: null, search: '41.9, 12.5', explanation: 'e', shownToUser: true }
    expect(getProposedMapLayer({ toolName, output: coords })).toEqual(coords)
  })

  test('getProposedMapLayer', () => {
    const output = valid()
    const toolName = 'map_proposeLayer'
    expect(getProposedMapLayer({ toolName, output })).toEqual(output)
    expect(getProposedMapLayer({ toolName, output: { error: { code: 'invalidProposal' } } })).toBeNull()
    expect(getProposedMapLayer({ toolName: 'query_propose', output })).toBeNull()
    expect(getProposedMapLayer({ toolName, output: null })).toBeNull()
    expect(getProposedMapLayer({ toolName, output: { ...output, attributeUuid: null, search: null } })).toBeNull()
  })

  test('requires: no survey access → not offered', () => {
    expect(proposeMapLayerTool.requires(newAnalysisToolContext({ survey, user: userWithoutAccess }))).toBe(false)
    expect(proposeMapLayerTool.requires(newAnalysisToolContext({ survey }))).toBe(true)
  })
})
