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

  test('getProposedMapLayer', () => {
    const output = valid()
    const toolName = 'map_proposeLayer'
    expect(getProposedMapLayer({ toolName, output })).toEqual(output)
    expect(getProposedMapLayer({ toolName, output: { error: { code: 'invalidProposal' } } })).toBeNull()
    expect(getProposedMapLayer({ toolName: 'query_propose', output })).toBeNull()
    expect(getProposedMapLayer({ toolName, output: null })).toBeNull()
  })

  test('requires: no survey access → not offered', () => {
    expect(proposeMapLayerTool.requires(newAnalysisToolContext({ survey, user: userWithoutAccess }))).toBe(false)
    expect(proposeMapLayerTool.requires(newAnalysisToolContext({ survey }))).toBe(true)
  })
})
