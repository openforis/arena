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

  it('Test update nodes with new values', async () => {
    const plotIdDef = getNodeDef('cluster/plot/plot_id')
    const treeDef = getNodeDef('cluster/plot/tree')
    const treeIdDef = getNodeDef('cluster/plot/tree/tree_id')
    const treeDbhDef = getNodeDef('cluster/plot/tree/dbh')

    const { record: recordUpdated, nodes: nodesUpdated } = await Record.updateAttributesWithValues({
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

  it('Test update nodes with new values does not have side effect on record', async () => {
    const plotIdDef = getNodeDef('cluster/plot/plot_id')
    const treeDef = getNodeDef('cluster/plot/tree')
    const treeIdDef = getNodeDef('cluster/plot/tree/tree_id')
    const treeDbhDef = getNodeDef('cluster/plot/tree/dbh')

    await Record.updateAttributesWithValues({
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

    expect(
      Record.updateAttributesWithValues({
        survey,
        entityDefUuid: treeDef.uuid,
        valuesByDefUuid: { [plotIdDef.uuid]: 1, [treeIdDef.uuid]: 3, [treeDbhDef.uuid]: 10 },
      })(record)
    ).rejects.toThrow()
  })

  it('Test update nodes (insertMissingNodes=true) with missing parent entity', async () => {
    const plotIdDef = getNodeDef('cluster/plot/plot_id')
    const treeDef = getNodeDef('cluster/plot/tree')
    const treeIdDef = getNodeDef('cluster/plot/tree/tree_id')
    const treeDbhDef = getNodeDef('cluster/plot/tree/dbh')

    const { record: recordUpdated, nodes: nodesUpdated } = await Record.updateAttributesWithValues({
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

    // expect default value on tree_status has been updated
    const treeStatusInsertedNode = RecordUtils.findNodeByPath('cluster/plot[0]/tree[2]/tree_status')(
      survey,
      recordUpdated
    )
    const treeStatusLiveCategoryItemUuid = SurveyUtils.getCategoryItemUuid({
      survey,
      categoryName: 'tree_status',
      codesPath: ['L'],
    })
    expect(Node.getCategoryItemUuid(treeStatusInsertedNode)).toEqual(treeStatusLiveCategoryItemUuid)
  })

  it('Test update code attribute ', async () => {
    const plotIdDef = getNodeDef('cluster/plot/plot_id')
    const treeDef = getNodeDef('cluster/plot/tree')
    const treeIdDef = getNodeDef('cluster/plot/tree/tree_id')
    const treeStatusDef = getNodeDef('cluster/plot/tree/tree_status')

    const treeStatusDeadCategoryItem = SurveyUtils.getCategoryItem({
      survey,
      categoryName: 'tree_status',
      codesPath: ['D'],
    })

    const { record: recordUpdated } = await Record.updateAttributesWithValues({
      survey,
      entityDefUuid: treeDef.uuid,
      valuesByDefUuid: {
        [plotIdDef.uuid]: 1,
        [treeIdDef.uuid]: 2,
        [treeStatusDef.uuid]: Node.newNodeValueCode({ itemUuid: treeStatusDeadCategoryItem.uuid }),
      },
      insertMissingNodes: true,
    })(record)

    const treeNode = RecordUtils.findNodeByPath('cluster/plot[0]/tree[1]')(survey, recordUpdated)
    const treeStatusNode = Record.getNodeChildByDefUuid(treeNode, treeStatusDef.uuid)(recordUpdated)

    expect(Node.getCategoryItemUuid(treeStatusNode)).toEqual(treeStatusDeadCategoryItem.uuid)
  })

  it('Test update node updates dependent nodes (applicability)', async () => {
    const plotIdDef = getNodeDef('cluster/plot/plot_id')
    const treeDef = getNodeDef('cluster/plot/tree')
    const treeIdDef = getNodeDef('cluster/plot/tree/tree_id')
    const treeStatusDef = getNodeDef('cluster/plot/tree/tree_status')
    const treeHeightDef = getNodeDef('cluster/plot/tree/tree_height')

    const treeStatusDeadCategoryItem = SurveyUtils.getCategoryItem({
      survey,
      categoryName: 'tree_status',
      codesPath: ['D'],
    })

    const { record: recordUpdated } = await Record.updateAttributesWithValues({
      survey,
      entityDefUuid: treeDef.uuid,
      valuesByDefUuid: {
        [plotIdDef.uuid]: 1,
        [treeIdDef.uuid]: 2,
        [treeStatusDef.uuid]: Node.newNodeValueCode({ itemUuid: treeStatusDeadCategoryItem.uuid }),
      },
      insertMissingNodes: true,
    })(record)

    // expect tree_height to be not applicable
    const treeNode = RecordUtils.findNodeByPath('cluster/plot[0]/tree[1]')(survey, recordUpdated)
    const treeHeightApplicable = Node.isChildApplicable(treeHeightDef.uuid)(treeNode)
    expect(treeHeightApplicable).toBe(false)
  })

  it('Test update node in nested single entities', async () => {
    const plotDef = getNodeDef('cluster/plot')
    const plotIdDef = getNodeDef('cluster/plot/plot_id')
    const plotRemarksDef = getNodeDef('cluster/plot/plot_details/plot_remarks')

    const { record: recordUpdated } = await Record.updateAttributesWithValues({
      survey,
      entityDefUuid: plotDef.uuid,
      valuesByDefUuid: {
        [plotIdDef.uuid]: 1,
        [plotRemarksDef.uuid]: 'This is plot 1 (modified)',
      },
    })(record)

    // expect plot remarks to be "This is plot 1 (modified)"
    const plotRemarksNode = RecordUtils.findNodeByPath('cluster/plot[0]/plot_details/plot_remarks')(
      survey,
      recordUpdated
    )
    expect(Node.getValue(plotRemarksNode)).toBe('This is plot 1 (modified)')
  })
})
