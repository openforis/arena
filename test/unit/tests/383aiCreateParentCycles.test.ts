import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { createProposedNodeDef } from '@webapp/ai/changeSets/newNodeDef'
import type { ChangeSet, NodeDefCreateOperation } from '@webapp/ai/changeSets/types'
import { nodeDefProposeCreateTool } from '@webapp/ai/tools/design/nodeDefProposeCreate'
import { runTool } from '@webapp/ai/tools/registry'
import { createToolContext, getDefByName } from '@test/unit/utils/assistantTestUtils'
import { buildRefSurvey, withNodeDef } from '@test/unit/utils/designSuggestionTestUtils'

let survey: any

beforeAll(async () => {
  survey = await buildRefSurvey()
})

const propose = async (input: object, target: any, ctxOverrides: Record<string, unknown> = {}) => {
  const ctx = createToolContext({ survey: target, ...ctxOverrides })
  const result: any = await runTool(nodeDefProposeCreateTool, { summary: 's', ...input }, ctx)
  return { result, changeSet: ctx.changeSets[0] as ChangeSet | undefined }
}

const created = (changeSet: ChangeSet | undefined) =>
  (changeSet?.operations as NodeDefCreateOperation[]).map((op) => op.nodeDef)

const clusterIn = (cycles: string[]) =>
  withNodeDef(survey, 'cluster', (nodeDef) => NodeDef.assocCycles(cycles)(nodeDef))

describe('a new node definition takes the cycles of its parent (383)', () => {
  test('an attribute is in every cycle of the parent, not only the current one', async () => {
    const { changeSet, result } = await propose(
      { nodeDefs: [{ parentName: 'cluster', type: 'text', name: 'notes' }] },
      clusterIn(['0', '1'])
    )
    expect(result.error).toBeUndefined()
    expect(created(changeSet).map((nodeDef) => NodeDef.getCycles(nodeDef))).toEqual([['0', '1']])
  })

  test('with no current cycle, a parent that is not in cycle 0 does not get a child in cycle 0', async () => {
    const { changeSet, result } = await propose(
      { nodeDefs: [{ parentName: 'cluster', type: 'text', name: 'notes' }] },
      clusterIn(['1']),
      { cycle: null }
    )
    expect(result.error).toBeUndefined()
    expect(created(changeSet).map((nodeDef) => NodeDef.getCycles(nodeDef))).toEqual([['1']])
  })

  test('a new entity and its children share the cycles, and the entity has a layout for each of them', async () => {
    const { changeSet, result } = await propose(
      {
        nodeDefs: [
          { parentName: 'cluster', type: 'entity', name: 'site', multiple: false },
          { parentName: 'site', type: 'integer', name: 'site_size' },
        ],
      },
      clusterIn(['0', '1'])
    )
    expect(result.error).toBeUndefined()
    const [site, siteSize] = created(changeSet)
    expect(NodeDef.getCycles(site)).toEqual(['0', '1'])
    expect(NodeDef.getCycles(siteSize)).toEqual(['0', '1'])
    expect(Object.keys(NodeDef.getLayout(site))).toEqual(['0', '1'])
    for (const cycle of ['0', '1']) expect(NodeDefLayout.isRenderForm(cycle)(site)).toBe(true)
  })

  test('createProposedNodeDef: cycles default to the parent cycles; `cycle` picks a single one', () => {
    const parent = NodeDef.assocCycles(['0', '2'])(getDefByName(survey, 'cluster'))
    expect(NodeDef.getCycles(createProposedNodeDef({ parent, type: 'text', name: 'a' }))).toEqual(['0', '2'])
    expect(NodeDef.getCycles(createProposedNodeDef({ parent, type: 'text', name: 'a', cycle: '2' }))).toEqual(['2'])
    expect(NodeDef.getCycles(createProposedNodeDef({ parent, type: 'text', name: 'a', cycles: ['0'] }))).toEqual(['0'])
  })

  test('an entity cannot be added under a parent that is a table in any of the entity cycles', async () => {
    const parentAsTableInCycleOne = withNodeDef(clusterIn(['0', '1']), 'cluster', (nodeDef) =>
      NodeDef.assocLayout({
        ...NodeDefLayout.newLayout('0', NodeDefLayout.renderType.form),
        ...NodeDefLayout.newLayout('1', NodeDefLayout.renderType.table),
      })(nodeDef)
    )
    const { changeSet, result } = await propose(
      { nodeDefs: [{ parentName: 'cluster', type: 'entity', name: 'site' }] },
      parentAsTableInCycleOne
    )
    expect(changeSet).toBeUndefined()
    expect(result.error.code).toBe('invalidProposal')
    expect(JSON.stringify(result.error.issues)).toContain('entityUnderTable')
  })
})
