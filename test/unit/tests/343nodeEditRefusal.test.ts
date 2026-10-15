import * as Survey from '@core/survey/survey'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'
import { findNodeEditRefusal } from '@core/record/nodeEditRefusal'

import { checkBatchEdit } from '@server/modules/record/service/update/nodesBatch/nodesBatchEditCheck'
import { checkNodeEditable } from '@webapp/ai/tools/cleaning/recordEditPermissions'

import * as RecordUtils from '../../utils/recordUtils'
import { cleaningTestRecord, cleaningTestSurvey } from '@test/unit/utils/aiCleaningTestUtils'

const dbhPath = 'cluster/plot[0]/tree[0]/dbh'

describe('Node edit refusal: the node and all its ancestors (343)', () => {
  let survey: any

  beforeAll(async () => {
    survey = await cleaningTestSurvey()
  })

  // sets a child flag in the meta of an ancestor of the node: level 1 is the parent, 2 the grandparent...
  const setup = ({ level, flag, value }: { level: number; flag: 'childApplicability' | 'cEdit'; value: boolean }) => {
    const record = cleaningTestRecord({ survey })
    const node = RecordUtils.findNodeByPath(dbhPath)(survey, record)
    let child = node
    let ancestor = Record.getParentNode(child)(record)
    for (let i = 1; i < level; i += 1) {
      child = ancestor
      ancestor = Record.getParentNode(child)(record)
    }
    const meta = { ...ancestor.meta, [flag]: { ...ancestor.meta?.[flag], [Node.getNodeDefUuid(child)]: value } }
    const recordWithMeta = { ...record, nodes: { ...record.nodes, [Node.getUuid(ancestor)]: { ...ancestor, meta } } }
    return { record: recordWithMeta, node }
  }

  test('no restriction: no refusal', () => {
    const record = cleaningTestRecord({ survey })
    const node = RecordUtils.findNodeByPath(dbhPath)(survey, record)
    expect(findNodeEditRefusal({ record, node })).toBeNull()
  })

  test('the root entity has no parent: no refusal', () => {
    const record = cleaningTestRecord({ survey })
    expect(findNodeEditRefusal({ record, node: Record.getRootNode(record) })).toBeNull()
  })

  test.each([1, 2, 3])('a node not applicable in its ancestor of level %s is refused as not applicable', (level) => {
    expect(findNodeEditRefusal(setup({ level, flag: 'childApplicability', value: false }))).toBe('notApplicable')
  })

  test.each([1, 2, 3])('a node read-only in its ancestor of level %s is refused as read only', (level) => {
    expect(findNodeEditRefusal(setup({ level, flag: 'cEdit', value: false }))).toBe('readOnly')
  })

  test('the nearest refusal is reported', () => {
    const { record, node } = setup({ level: 1, flag: 'cEdit', value: false })
    const tree = Record.getParentNode(node)(record)
    const plot = Record.getParentNode(tree)(record)
    const plotMeta = { ...plot.meta, childApplicability: { [Node.getNodeDefUuid(tree)]: false } }
    const both = { ...record, nodes: { ...record.nodes, [Node.getUuid(plot)]: { ...plot, meta: plotMeta } } }
    expect(findNodeEditRefusal({ record: both, node })).toBe('readOnly')
  })

  test('the server check refuses an edit in a not applicable ancestor, as failed attributeNotEditable', () => {
    const { record, node } = setup({ level: 3, flag: 'childApplicability', value: false })
    const outcome = checkBatchEdit({
      survey,
      record,
      recordUuid: Record.getUuid(record),
      edit: { index: 2, nodeUuid: Node.getUuid(node), from: Node.getValue(node, null), to: 12 },
    })
    expect(outcome).toMatchObject({
      ok: false,
      result: { index: 2, status: 'failed', messageKey: 'validationErrors:nodeValueParser.attributeNotEditable' },
    })
  })

  test('the server check accepts the same edit when no ancestor restricts it', () => {
    const record = cleaningTestRecord({ survey })
    const node = RecordUtils.findNodeByPath(dbhPath)(survey, record)
    const outcome = checkBatchEdit({
      survey,
      record,
      recordUuid: Record.getUuid(record),
      edit: { index: 0, nodeUuid: Node.getUuid(node), from: Node.getValue(node, null), to: 12 },
    })
    expect(outcome.ok).toBe(true)
  })

  test('the browser check refuses what the server refuses', () => {
    const nodeDefOf = (node: any) => Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
    const notApplicable = setup({ level: 3, flag: 'childApplicability', value: false })
    expect(checkNodeEditable({ ...notApplicable, nodeDef: nodeDefOf(notApplicable.node) })?.code).toBe(
      'attributeNotEditable'
    )
    const readOnly = setup({ level: 2, flag: 'cEdit', value: false })
    expect(checkNodeEditable({ ...readOnly, nodeDef: nodeDefOf(readOnly.node) })?.code).toBe('attributeNotEditable')
  })
})
