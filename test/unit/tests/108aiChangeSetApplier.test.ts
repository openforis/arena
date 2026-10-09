import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'

import { applyChangeSet, getChangedProps, type ApplierDeps } from '@webapp/ai/changeSets/applyChangeSet'
import { summarizeResults } from '@webapp/ai/changeSets/describeOperation'
import { createProposedNodeDef } from '@webapp/ai/changeSets/newNodeDef'
import type { ChangeOperation, ChangeSet } from '@webapp/ai/changeSets/types'
import { buildAssistantSurvey, getDefByName } from '@test/unit/utils/assistantTestUtils'

let initialSurvey: any

beforeAll(async () => {
  initialSurvey = await buildAssistantSurvey({ languages: ['en', 'fr'] })
})

// fake Redux: the survey changes as the real reducers would change it
const createFakeDeps = (overrides: Partial<ApplierDeps> = {}) => {
  let survey = initialSurvey
  const calls: [string, any][] = []
  const deps: ApplierDeps = {
    getSurvey: () => survey,
    getCycle: () => '0',
    isSurveyDirty: () => false,
    postNodeDef: async (nodeDef) => {
      calls.push(['post', NodeDef.getName(nodeDef)])
    },
    putNodeDefProps: async (params) => {
      calls.push(['put', params])
    },
    onNodeDefCreated: (nodeDef) => {
      calls.push(['created', NodeDef.getName(nodeDef)])
      survey = Survey.assocNodeDef({ nodeDef })(survey)
    },
    onNodeDefUpdated: (nodeDef) => {
      calls.push(['updated', NodeDef.getName(nodeDef)])
      survey = Survey.assocNodeDef({ nodeDef })(survey)
    },
    onNodeDefSaved: ({ nodeDef, nodeDefParent }) => {
      calls.push(['saved', `${NodeDef.getName(nodeDef)} < ${nodeDefParent ? NodeDef.getName(nodeDefParent) : '-'}`])
    },
    ...overrides,
  }
  return { deps, calls, setSurvey: (value: any) => (survey = value), getSurvey: () => survey }
}

const uuidOf = (name: string) => NodeDef.getUuid(getDefByName(initialSurvey, name))

const buildOperations = () => {
  const cluster = getDefByName(initialSurvey, 'cluster')
  const site = createProposedNodeDef({ parent: cluster, type: 'entity', cycle: '0', name: 'site' })
  const siteName = createProposedNodeDef({ parent: site, type: 'text', cycle: '0', name: 'site_name' })
  const notesUuid = uuidOf('cluster_notes')
  const operations: ChangeOperation[] = [
    { id: 'o1', type: 'nodeDef.create', nodeDef: site, parentUuid: NodeDef.getUuid(cluster) },
    { id: 'o2', type: 'nodeDef.create', nodeDef: siteName, parentUuid: NodeDef.getUuid(site) },
    {
      id: 'o3',
      type: 'label.set',
      nodeDefUuid: uuidOf('cluster_id'),
      kind: 'labels',
      lang: 'fr',
      from: null,
      to: 'Identifiant',
    },
    {
      id: 'o4',
      type: 'expression.set',
      nodeDefUuid: notesUuid,
      prop: 'validations.expressions',
      from: [],
      to: [NodeDefExpression.createExpression({ expression: 'cluster_notes != "x"' })],
    },
    { id: 'o5', type: 'nodeDef.update', nodeDefUuid: notesUuid, prop: 'readOnly', from: false, to: true },
  ]
  return operations
}

const changeSetOf = (operations: ChangeOperation[]): ChangeSet => ({
  id: 'cs',
  surveyId: 7,
  summary: 'Add a site entity',
  operations,
  createdAt: '2026-10-06T10:00:00.000Z',
})

const allIds = (operations: ChangeOperation[]) => operations.map((op) => op.id)

describe('applyChangeSet', () => {
  test('persists in proposal order with the follow-up dispatches', async () => {
    const operations = buildOperations()
    const { deps, calls } = createFakeDeps()
    const results = await applyChangeSet({ changeSet: changeSetOf(operations), operationIds: allIds(operations), deps })
    expect(results).toEqual(allIds(operations).map((id) => ({ id, status: 'applied' })))
    expect(calls.map(([type, value]) => (type === 'put' ? ['put', value.nodeDefUuid] : [type, value]))).toEqual([
      ['post', 'site'],
      ['created', 'site'],
      ['saved', 'site < cluster'],
      ['post', 'site_name'],
      ['created', 'site_name'],
      ['saved', 'site_name < site'],
      ['put', uuidOf('cluster_id')],
      ['updated', 'cluster_id'],
      ['saved', 'cluster_id < cluster'],
      ['put', uuidOf('cluster_notes')],
      ['updated', 'cluster_notes'],
      ['saved', 'cluster_notes < cluster'],
    ])
  })

  test('only the changed keys are sent; labels and validations whole', async () => {
    const operations = buildOperations()
    const { deps, calls } = createFakeDeps()
    await applyChangeSet({ changeSet: changeSetOf(operations), operationIds: ['o3', 'o4', 'o5'], deps })
    const puts = calls.filter(([type]) => type === 'put').map(([, params]) => params)
    expect(puts[0]).toEqual({
      nodeDefUuid: uuidOf('cluster_id'),
      parentUuid: uuidOf('cluster'),
      props: { labels: { en: 'Cluster id', fr: 'Identifiant' } },
      propsAdvanced: {},
    })
    expect(Object.keys(puts[1].props)).toEqual(['readOnly'])
    expect(Object.keys(puts[1].propsAdvanced)).toEqual(['validations'])
    expect(puts[1].propsAdvanced.validations.expressions[0].expression).toBe('cluster_notes != "x"')
  })

  test('a created node definition is sent without the temporary flag', async () => {
    const operations = buildOperations()
    let posted: any = null
    const { deps } = createFakeDeps({
      postNodeDef: async (nodeDef) => {
        posted = nodeDef
      },
    })
    await applyChangeSet({ changeSet: changeSetOf(operations), operationIds: ['o1'], deps })
    expect(NodeDef.getName(posted)).toBe('site')
    expect(NodeDef.isTemporary(posted)).toBe(false)
  })

  test('a conflicting operation is not sent', async () => {
    const operations = buildOperations()
    const { deps, calls, setSurvey } = createFakeDeps()
    const edited = NodeDef.assocLabel({ label: 'Déjà', lang: 'fr' })(getDefByName(initialSurvey, 'cluster_id'))
    setSurvey(Survey.assocNodeDef({ nodeDef: edited })(initialSurvey))
    const results = await applyChangeSet({ changeSet: changeSetOf(operations), operationIds: ['o3', 'o5'], deps })
    expect(results).toEqual([
      { id: 'o3', status: 'conflict', message: 'valueChanged' },
      { id: 'o5', status: 'applied' },
    ])
    expect(calls.filter(([type]) => type === 'put').map(([, params]) => params.nodeDefUuid)).toEqual([
      uuidOf('cluster_notes'),
    ])
  })

  test('refuses everything while the survey is dirty', async () => {
    const operations = buildOperations()
    const { deps, calls } = createFakeDeps({ isSurveyDirty: () => true })
    const results = await applyChangeSet({ changeSet: changeSetOf(operations), operationIds: ['o1', 'o3'], deps })
    expect(results).toEqual([
      { id: 'o1', status: 'skipped', message: 'surveyDirty' },
      { id: 'o3', status: 'skipped', message: 'surveyDirty' },
    ])
    expect(calls).toEqual([])
  })

  test('a failed create skips its dependants; other node definitions continue', async () => {
    const operations = buildOperations()
    const { deps, calls } = createFakeDeps({
      postNodeDef: async () => {
        throw new Error('Server error')
      },
    })
    const results = await applyChangeSet({ changeSet: changeSetOf(operations), operationIds: ['o1', 'o2', 'o3'], deps })
    expect(results).toEqual([
      { id: 'o1', status: 'failed', message: 'Server error' },
      { id: 'o2', status: 'skipped', message: 'dependencyNotApplied' },
      { id: 'o3', status: 'applied' },
    ])
    expect(calls.map(([type]) => type)).toEqual(['put', 'updated', 'saved'])
  })

  test('an operation on a new definition whose create is not selected is skipped', async () => {
    const operations = buildOperations()
    const { deps } = createFakeDeps()
    const results = await applyChangeSet({ changeSet: changeSetOf(operations), operationIds: ['o2'], deps })
    expect(results).toEqual([{ id: 'o2', status: 'skipped', message: 'dependencyNotApplied' }])
  })
})

describe('getChangedProps', () => {
  test('top-level keys whose value changed', () => {
    const before = { props: { name: 'a', labels: { en: 'A' } }, propsAdvanced: { applicable: [] } }
    const after = {
      props: { name: 'a', labels: { en: 'A', fr: 'A' } },
      propsAdvanced: { applicable: [], visibleIf: [] },
    }
    expect(getChangedProps(before, after)).toEqual({
      props: { labels: { en: 'A', fr: 'A' } },
      propsAdvanced: { visibleIf: [] },
    })
  })
})

describe('summarizeResults', () => {
  test('counts the applied operations and names the others', () => {
    const operations = buildOperations()
    const text = summarizeResults({
      changeSet: changeSetOf(operations),
      survey: initialSurvey,
      results: [
        { id: 'o1', status: 'applied' },
        { id: 'o3', status: 'conflict', message: 'valueChanged' },
      ],
    })
    expect(text).toBe('Applied 1 of 2 operations; `cluster_id` label (fr): conflict (valueChanged).')
  })
})
