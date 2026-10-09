import { defaultAiPolicy } from '@common/ai/policy'

import { getTools, toWebMcpDescriptor } from '@webapp/ai/tools/registry'
import { analysisTools } from '@webapp/ai/tools/analysis'

import { newAnalysisToolContext, userWithoutAccess } from '@test/unit/utils/aiAnalysisTestUtils'

import * as DataTest from '../../utils/dataTest'
import { getContextUser } from '../../integration/config/context'

let survey: any = null

const schemaToolNames = [
  'category_findItems',
  'docs_search',
  'nodeDef_search',
  'query_listEntities',
  'query_propose',
  'survey_getOverview',
  'view_getCurrent',
]
const dataToolNames = ['query_count', 'query_run', 'records_countByStep', 'records_countOverTime']

const toolNames = ({ effective = defaultAiPolicy, hostingClass, user = undefined, area = 'analysis' }: any) =>
  getTools({ area, ctx: newAnalysisToolContext({ survey, ...(user ? { user } : {}) }), effective, hostingClass })
    .map((tool) => tool.name)
    .sort()

beforeAll(async () => {
  survey = await DataTest.createTestSurvey({ user: getContextUser() })
})

describe('analysis tools in the registry', () => {
  test('default policy, cloud engine: schema tools only, no data tool', () => {
    const names = toolNames({ hostingClass: 'cloud' })
    expect(names).toEqual(schemaToolNames)
    for (const name of dataToolNames) {
      expect(names).not.toContain(name)
    }
  })

  test('default policy, organisation server: schema tools only', () => {
    expect(toolNames({ hostingClass: 'orgHosted' })).toEqual(schemaToolNames)
  })

  test('default policy, on-device engine: data tools too', () => {
    expect(toolNames({ hostingClass: 'onDevice' })).toEqual([...schemaToolNames, ...dataToolNames].sort())
  })

  test('a policy that allows data in the cloud offers the data tools to the cloud engine', () => {
    const effective = { schema: 'cloud', data: 'cloud' }
    expect(toolNames({ effective, hostingClass: 'cloud' })).toEqual([...schemaToolNames, ...dataToolNames].sort())
  })

  test('a policy that is off offers nothing', () => {
    expect(toolNames({ effective: { schema: 'off', data: 'off' }, hostingClass: 'onDevice' })).toEqual([])
  })

  test('a user who cannot view the survey gets no survey tool', () => {
    expect(toolNames({ hostingClass: 'onDevice', user: userWithoutAccess })).toEqual(['docs_search', 'view_getCurrent'])
  })

  test('the analysis tools are not offered in the design area', () => {
    const designNames = toolNames({ hostingClass: 'onDevice', area: 'design' })
    for (const name of ['query_propose', 'query_run', 'category_findItems']) {
      expect(designNames).not.toContain(name)
    }
  })

  test('names are valid function names and WebMCP descriptors can be built', () => {
    expect(analysisTools).toHaveLength(7)
    for (const tool of analysisTools) {
      expect(tool.name).toMatch(/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/)
      const descriptor = toWebMcpDescriptor(tool)
      expect(descriptor.inputSchema.type).toBe('object')
      expect(descriptor.annotations.readOnlyHint).toBe(true)
    }
  })
})
