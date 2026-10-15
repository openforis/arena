import * as NodeDef from '@core/survey/nodeDef'

import { createProposedNodeDef } from '@webapp/ai/changeSets/newNodeDef'
import { getDefByName } from '@test/unit/utils/assistantTestUtils'
import { buildRefSurvey, withNodeDef } from '@test/unit/utils/designSuggestionTestUtils'

let survey: any

beforeAll(async () => {
  survey = await buildRefSurvey()
})

describe('NodeDefManager.insertNodeDef lists the new node definition in the parent layout of every cycle (384)', () => {
  const insert = async (cycles: string[], cycle?: string) => {
    const { insertNodeDef } = await import('@server/modules/nodeDef/manager/nodeDefManager')
    const parent = NodeDef.assocCycles(['0', '1'])(getDefByName(survey, 'cluster'))
    const target = withNodeDef(survey, 'cluster', () => parent)
    const nodeDef = createProposedNodeDef({ parent, type: 'text', name: 'notes', cycles })
    // the queries are faked (the unit tests are bundled: jest.mock does not reach the repositories)
    const updates: { props: any }[] = []
    const tx: any = {
      one: async (sql: string, params: any[]) => {
        if (sql.includes('INSERT INTO')) return nodeDef
        updates.push({ props: params[0] })
        return {}
      },
      query: async () => undefined,
      none: async () => undefined,
    }
    const client: any = { tx: async (fn: (t: unknown) => unknown) => fn(tx) }
    await insertNodeDef(
      { user: { uuid: 'u' }, survey: target, nodeDef, addLogs: false, ...(cycle ? { cycle } : {}) },
      client
    )
    return { params: updates[0], parentLayout: NodeDef.getLayout(parent) }
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
