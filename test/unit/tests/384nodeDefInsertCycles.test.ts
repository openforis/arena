import * as NodeDef from '@core/survey/nodeDef'

import { createProposedNodeDef } from '@webapp/ai/changeSets/newNodeDef'
import { getDefByName } from '@test/unit/utils/assistantTestUtils'
import { buildRefSurvey, withNodeDef } from '@test/unit/utils/designSuggestionTestUtils'

const mockUpdateNodeDefProps = jest.fn()

jest.mock('@server/modules/nodeDef/repository/nodeDefRepository', () => ({
  insertNodeDef: async (_surveyId: number, nodeDef: unknown) => nodeDef,
  updateNodeDefProps: (params: unknown) => mockUpdateNodeDefProps(params),
}))
jest.mock('@server/modules/activityLog/repository/activityLogRepository', () => ({ insert: async () => undefined }))
jest.mock('@server/modules/survey/repository/surveySchemaRepositoryUtils', () => ({
  markSurveyDraft: async () => undefined,
}))

let survey: any

beforeAll(async () => {
  survey = await buildRefSurvey()
})

beforeEach(() => mockUpdateNodeDefProps.mockClear())

describe('NodeDefManager.insertNodeDef lists the new node definition in the parent layout of every cycle (384)', () => {
  const insert = async (cycles: string[], cycle?: string) => {
    const { insertNodeDef } = await import('@server/modules/nodeDef/manager/nodeDefManager')
    const parent = NodeDef.assocCycles(['0', '1'])(getDefByName(survey, 'cluster'))
    const target = withNodeDef(survey, 'cluster', () => parent)
    const nodeDef = createProposedNodeDef({ parent, type: 'text', name: 'notes', cycles })
    const client: any = { tx: async (fn: (t: unknown) => unknown) => fn({}) }
    await insertNodeDef({ user: { uuid: 'u' }, survey: target, nodeDef, ...(cycle ? { cycle } : {}) }, client)
    const [params] = mockUpdateNodeDefProps.mock.calls.map(([call]) => call)
    return { params, parentLayout: NodeDef.getLayout(parent) }
  }

  test('a node definition in two cycles is added to the parent layout of both', async () => {
    const { params } = await insert(['0', '1'], '0')
    expect(Object.keys(params.props.layout).sort()).toEqual(['0', '1'])
  })

  test('a node definition in one cycle only is added to that cycle (the designer)', async () => {
    const { params, parentLayout } = await insert(['1'], '1')
    expect(params.props.layout['0']).toEqual(parentLayout['0'])
    expect(params.props.layout['1']).toBeDefined()
  })
})
