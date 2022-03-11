import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import * as RecordUtils from '../../utils/recordUtils'
import * as SurveyUtils from '../../utils/surveyUtils'
import * as DataTest from '../../utils/dataTest'

import { getContextUser } from '../../integration/config/context'

let survey = {}
let record = {}

const getNodeDef = (path) => SurveyUtils.getNodeDefByPath({ survey, path })

describe('RecordNodesUpdater Test', () => {
  beforeAll(async () => {
    const user = getContextUser()

    survey = DataTest.createTestSurvey({ user })

    record = DataTest.createTestRecord({ user, survey })
  }, 10000)

  it('Test update nodes with new values', () => {
    const plotIdDef = getNodeDef('cluster/plot/plot_id')
    const treeDef = getNodeDef('cluster/plot/tree')
    const treeIdDef = getNodeDef('cluster/plot/tree/tree_id')
    const treeDbhDef = getNodeDef('cluster/plot/tree/dbh')

    const { record: recordUpdated, nodes: nodesUpdated } = Record.updateAttributesWithValues({
      survey,
      entityDefUuid: treeDef.uuid,
      valuesByDefUuid: { [plotIdDef.uuid]: 1, [treeIdDef.uuid]: 2, [treeDbhDef.uuid]: 20 },
    })(record)

    // expect only one node modified
    expect(Object.values(nodesUpdated).length).toBe(1)

    // expect node value has been updated
    const dbhUpdatedNode = RecordUtils.findNodeByPath('cluster/plot[0]/tree[1]/dbh')(survey, recordUpdated)
    expect(Node.getValue(dbhUpdatedNode)).toEqual(20)
  })

  it('Test update nodes with new values does not have side effect on record', () => {
    const plotIdDef = getNodeDef('cluster/plot/plot_id')
    const treeDef = getNodeDef('cluster/plot/tree')
    const treeIdDef = getNodeDef('cluster/plot/tree/tree_id')
    const treeDbhDef = getNodeDef('cluster/plot/tree/dbh')

    Record.updateAttributesWithValues({
      survey,
      entityDefUuid: treeDef.uuid,
      valuesByDefUuid: { [plotIdDef.uuid]: 1, [treeIdDef.uuid]: 2, [treeDbhDef.uuid]: 20 },
    })(record)

    // expect old record value hasn't been modified
    const dbhOldNode = RecordUtils.findNodeByPath('cluster/plot[0]/tree[1]/dbh')(survey, record)
    expect(Node.getValue(dbhOldNode)).toEqual(10.123)
  })

  it('Test update nodes (insertMissingNodes=false) with missing parent entity throws error', () => {
    const plotIdDef = getNodeDef('cluster/plot/plot_id')
    const treeDef = getNodeDef('cluster/plot/tree')
    const treeIdDef = getNodeDef('cluster/plot/tree/tree_id')
    const treeDbhDef = getNodeDef('cluster/plot/tree/dbh')

    const fn = () =>
      Record.updateAttributesWithValues({
        survey,
        entityDefUuid: treeDef.uuid,
        valuesByDefUuid: { [plotIdDef.uuid]: 1, [treeIdDef.uuid]: 3, [treeDbhDef.uuid]: 10 },
      })(record)

    expect(fn).toThrow()
  })

  it('Test update nodes (insertMissingNodes=true) with missing parent entity', () => {
    const plotIdDef = getNodeDef('cluster/plot/plot_id')
    const treeDef = getNodeDef('cluster/plot/tree')
    const treeIdDef = getNodeDef('cluster/plot/tree/tree_id')
    const treeDbhDef = getNodeDef('cluster/plot/tree/dbh')

    const { record: recordUpdated, nodes: nodesUpdated } = Record.updateAttributesWithValues({
      survey,
      entityDefUuid: treeDef.uuid,
      valuesByDefUuid: { [plotIdDef.uuid]: 1, [treeIdDef.uuid]: 3, [treeDbhDef.uuid]: 10 },
      insertMissingNodes: true,
    })(record)

    // expect plot descendant nodes created
    const expectedNodesCreatedCount = 1 + Survey.getNodeDefChildren(treeDef)(survey).length // tree node + descendants
    expect(Object.values(nodesUpdated).length).toBe(expectedNodesCreatedCount)

    // expect node value has been updated
    const dbhInsertedNode = RecordUtils.findNodeByPath('cluster/plot[0]/tree[2]/dbh')(survey, recordUpdated)
    expect(Node.getValue(dbhInsertedNode)).toEqual(10)
  })
})
