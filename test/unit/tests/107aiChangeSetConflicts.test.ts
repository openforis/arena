import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'

import { isDeepEqual } from '@webapp/ai/changeSets/deepEqual'
import { findConflicts } from '@webapp/ai/changeSets/findConflicts'
import { createProposedNodeDef } from '@webapp/ai/changeSets/newNodeDef'
import type { ChangeOperation, ChangeSet } from '@webapp/ai/changeSets/types'
import { buildAssistantSurvey, getDefByName } from '@test/unit/utils/assistantTestUtils'

let survey: any

beforeAll(async () => {
  survey = await buildAssistantSurvey()
})

const uuidOf = (name: string) => NodeDef.getUuid(getDefByName(survey, name))
const changeSetOf = (operations: ChangeOperation[]): ChangeSet => ({
  id: 'cs',
  surveyId: 7,
  summary: '',
  operations,
  createdAt: '2026-10-06T10:00:00.000Z',
})
const replaceDef = (target: any, nodeDef: any) => Survey.assocNodeDef({ nodeDef })(target)

const labelOp = (): ChangeOperation => ({
  id: 'label',
  type: 'label.set',
  nodeDefUuid: uuidOf('cluster_id'),
  kind: 'labels',
  lang: 'en',
  from: 'Cluster id',
  to: 'Cluster identifier',
})
const updateOp = (): ChangeOperation => ({
  id: 'update',
  type: 'nodeDef.update',
  nodeDefUuid: uuidOf('cluster_notes'),
  prop: 'readOnly',
  from: false,
  to: true,
})
const expressionOp = (): ChangeOperation => ({
  id: 'expression',
  type: 'expression.set',
  nodeDefUuid: uuidOf('cluster_notes'),
  prop: 'defaultValues',
  from: [],
  to: [NodeDefExpression.createExpression({ expression: '"x"' })],
})
const createOp = (name = 'cluster_remarks'): ChangeOperation & { type: 'nodeDef.create' } => {
  const parent = getDefByName(survey, 'cluster')
  return {
    id: `create-${name}`,
    type: 'nodeDef.create',
    nodeDef: createProposedNodeDef({ parent, type: 'text', cycle: '0', name }),
    parentUuid: NodeDef.getUuid(parent),
  }
}

describe('isDeepEqual', () => {
  test('ignores key order and treats undefined as null', () => {
    expect(isDeepEqual({ a: 1, b: [1, { c: 2, d: 3 }] }, { b: [1, { d: 3, c: 2 }], a: 1 })).toBe(true)
    expect(isDeepEqual(undefined, null)).toBe(true)
    expect(isDeepEqual([], null)).toBe(false)
    expect(isDeepEqual({ a: 1 }, { a: 2 })).toBe(false)
  })
})

describe('findConflicts', () => {
  test('no conflict on an unchanged survey, for every operation type', () => {
    expect(findConflicts(changeSetOf([labelOp(), updateOp(), expressionOp(), createOp()]), survey)).toEqual([])
  })

  test('label.set: valueChanged and nodeDefMissing', () => {
    const changed = replaceDef(
      survey,
      NodeDef.assocLabel({ label: 'Edited', lang: 'en' })(getDefByName(survey, 'cluster_id'))
    )
    expect(findConflicts(changeSetOf([labelOp()]), changed)).toEqual([{ id: 'label', reason: 'valueChanged' }])
    const removed = Survey.dissocNodeDef(uuidOf('cluster_id'))(survey)
    expect(findConflicts(changeSetOf([labelOp()]), removed)).toEqual([{ id: 'label', reason: 'nodeDefMissing' }])
  })

  test('nodeDef.update: valueChanged', () => {
    const changed = replaceDef(
      survey,
      NodeDef.assocProp({ key: 'readOnly', value: true })(getDefByName(survey, 'cluster_notes'))
    )
    expect(findConflicts(changeSetOf([updateOp()]), changed)).toEqual([{ id: 'update', reason: 'valueChanged' }])
  })

  test('nodeDef.update: a rename to a name taken in the meantime', () => {
    const rename: ChangeOperation = {
      id: 'rename',
      type: 'nodeDef.update',
      nodeDefUuid: uuidOf('cluster_notes'),
      prop: 'name',
      from: 'cluster_notes',
      to: 'cluster_remarks',
    }
    const parent = getDefByName(survey, 'cluster')
    const other = createProposedNodeDef({ parent, type: 'text', cycle: '0', name: 'cluster_remarks' })
    expect(findConflicts(changeSetOf([rename]), replaceDef(survey, other))).toEqual([
      { id: 'rename', reason: 'nameTaken' },
    ])
  })

  test('expression.set: valueChanged', () => {
    const notes = getDefByName(survey, 'cluster_notes')
    const withDefault = NodeDef.assocDefaultValues([NodeDefExpression.createExpression({ expression: '"y"' })])(notes)
    expect(findConflicts(changeSetOf([expressionOp()]), replaceDef(survey, withDefault))).toEqual([
      { id: 'expression', reason: 'valueChanged' },
    ])
  })

  test('nodeDef.create: alreadyExists, parentMissing, nameTaken', () => {
    const op = createOp()
    expect(findConflicts(changeSetOf([op]), replaceDef(survey, op.nodeDef))).toEqual([
      { id: op.id, reason: 'alreadyExists' },
    ])
    const withoutParent = Survey.dissocNodeDef(uuidOf('cluster'))(survey)
    expect(findConflicts(changeSetOf([op]), withoutParent)).toEqual([{ id: op.id, reason: 'parentMissing' }])
    const sameName = createOp('cluster_notes')
    expect(findConflicts(changeSetOf([sameName]), survey)).toEqual([{ id: sameName.id, reason: 'nameTaken' }])
  })

  test('operations on a node definition created by the same change set are not conflicts', () => {
    const parent = getDefByName(survey, 'cluster')
    const entity = createProposedNodeDef({ parent, type: 'entity', cycle: '0', name: 'site' })
    const child = createProposedNodeDef({ parent: entity, type: 'text', cycle: '0', name: 'site_name' })
    const operations: ChangeOperation[] = [
      { id: 'e', type: 'nodeDef.create', nodeDef: entity, parentUuid: NodeDef.getUuid(parent) },
      { id: 'c', type: 'nodeDef.create', nodeDef: child, parentUuid: NodeDef.getUuid(entity) },
      {
        id: 'l',
        type: 'label.set',
        nodeDefUuid: NodeDef.getUuid(child),
        kind: 'labels',
        lang: 'en',
        from: null,
        to: 'Site',
      },
    ]
    expect(findConflicts(changeSetOf(operations), survey)).toEqual([])
  })

  test('only the selected operations', () => {
    const changed = replaceDef(
      survey,
      NodeDef.assocLabel({ label: 'Edited', lang: 'en' })(getDefByName(survey, 'cluster_id'))
    )
    expect(findConflicts(changeSetOf([labelOp(), updateOp()]), changed, { operationIds: ['update'] })).toEqual([])
  })
})
