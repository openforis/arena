import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'

import { getContextUser } from '../../integration/config/context'

const { integer, text } = NodeDef.nodeDefType

describe('Record.replaceNodes', () => {
  let survey: any = null
  let record: any = null

  beforeAll(async () => {
    const user = getContextUser()
    survey = await SB.survey(
      user,
      SB.entity('cluster', SB.attribute('cluster_id', integer).key(), SB.attribute('notes', text))
    ).build()
    record = RB.record(
      user,
      survey,
      RB.entity('cluster', RB.attribute('cluster_id', 1), RB.attribute('notes', 'some notes'))
    ).build()
  })

  const getNotesNodes = (recordParam: any) =>
    Record.getNodeChildrenByDefUuid(
      Record.getRootNode(recordParam),
      NodeDef.getUuid(Survey.getNodeDefByName('notes')(survey))
    )(recordParam)

  test('stores an index built from scratch, even if the nodes are already in the record', () => {
    const { _nodesIndex: indexExpected, ...recordWithoutIndex } = record
    const recordUpdated: any = Record.replaceNodes(Record.getNodes(record))(recordWithoutIndex)
    expect(recordUpdated._nodesIndex).toEqual(indexExpected)
  })

  test('the index is kept when merging the same nodes (no index rebuild for every node)', () => {
    const recordUpdated: any = Record.replaceNodes(Record.getNodes(record))(record)
    const index = recordUpdated._nodesIndex
    expect(index).toBeTruthy()
    const mergeNodes: any = Record.mergeNodes
    const recordMerged = mergeNodes(Record.getNodes(recordUpdated), { sideEffect: true })(recordUpdated)
    expect(recordMerged._nodesIndex).toBe(index)
  })

  test('removed nodes are not kept in the index, and the original record is not changed', () => {
    const notesNode: any = getNotesNodes(record)[0]
    const nodes = { ...Record.getNodes(record) }
    delete nodes[Node.getUuid(notesNode)]
    const recordUpdated = Record.replaceNodes(nodes)(record)
    expect(getNotesNodes(recordUpdated)).toEqual([])
    expect(getNotesNodes(record)).toHaveLength(1)
  })
})
