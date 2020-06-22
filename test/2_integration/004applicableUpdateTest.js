import { expect } from 'chai'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as PromiseUtils from '@core/promiseUtils'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as RecordManager from '@server/modules/record/manager/recordManager'

import { getContextUser } from '../testContext'

import * as SB from './utils/surveyBuilder'
import * as RB from './utils/recordBuilder'
import * as RecordUtils from './utils/recordUtils'

let survey
let record

describe('Applicable Test', () => {
  before(async () => {
    const user = getContextUser()

    survey = await SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_no', NodeDef.nodeDefType.integer).key(),
        SB.attribute('num', NodeDef.nodeDefType.decimal),
        SB.attribute('dependent_node').applyIf('num > 100'),
        SB.entity(
          'plot',
          SB.attribute('plot_no').key(),
          SB.entity('tree', SB.attribute('tree_no').key(), SB.attribute('tree_dbh').applyIf('plot_no > 10'))
        ).multiple()
      )
    ).buildAndStore()

    record = await RB.record(
      user,
      survey,
      RB.entity(
        'cluster',
        RB.attribute('cluster_no', 1),
        RB.attribute('num', 1),
        RB.entity('plot', RB.attribute('plot_no', 1), RB.entity('tree', RB.attribute('tree_no', 1)))
      )
    ).buildAndStore()
  })

  after(async () => {
    if (survey) {
      await SurveyManager.deleteSurvey(Survey.getId(survey))
    }
  })

  it('Applicable update', async () => {
    const nodeSource = RecordUtils.findNodeByPath('cluster/num')(survey, record)
    const nodeDependent = RecordUtils.findNodeByPath('cluster/dependent_node')(survey, record)
    const nodeDependentParent = Record.getParentNode(nodeDependent)(record)
    const nodeDependentParentUuid = Node.getUuid(nodeDependentParent)
    const nodeDependentDefUuid = Node.getNodeDefUuid(nodeDependent)

    // Test values, couples of expected values by input
    const testValues = [
      [10, false],
      [100, false],
      [101, true],
      [1000, true],
      [50, false],
    ]

    await PromiseUtils.each(testValues, async (testValue) => {
      const [sourceValue, expectedValue] = testValue

      // Update source node value
      const nodesUpdated = {
        [Node.getUuid(nodeSource)]: Node.assocValue(sourceValue)(nodeSource),
      }
      record = Record.assocNodes(nodesUpdated)(record)

      // Update dependent nodes
      const { record: recordUpdate } = await RecordManager.updateNodesDependents(survey, record, nodesUpdated)
      record = recordUpdate

      const nodeDependentParentUpdated = Record.getNodeByUuid(nodeDependentParentUuid)(record)

      const applicable = Node.isChildApplicable(nodeDependentDefUuid)(nodeDependentParentUpdated)

      expect(applicable).to.equal(expectedValue, sourceValue)
    })
  })

  it('Applicable evaluated on entity creation', async () => {
    const nodeTree = RecordUtils.findNodeByPath('cluster/plot[1]/tree[1]')(survey, record)
    const nodeTreeDbh = RecordUtils.findNodeByPath('cluster/plot[1]/tree[1]/tree_dbh')(survey, record)

    // Tree_dbh should be not applicable (plot_no <= 10)
    expect(Node.isChildApplicable(Node.getNodeDefUuid(nodeTreeDbh))(nodeTree)).to.be.equal(false)
  })

  it('Applicable in multiple entity update', async () => {
    const nodePlotNo = RecordUtils.findNodeByPath('cluster/plot[1]/plot_no')(survey, record)
    const nodePlotNoUpdated = Node.assocValue(11)(nodePlotNo)
    const recordUpdated = await RecordManager.persistNode(getContextUser(), survey, record, nodePlotNoUpdated)

    const nodeTree = RecordUtils.findNodeByPath('cluster/plot[1]/tree[1]')(survey, recordUpdated)
    const nodeTreeDbh = RecordUtils.findNodeByPath('cluster/plot[1]/tree[1]/tree_dbh')(survey, recordUpdated)

    // Tree_dbh should be applicable (plot_no > 10)
    expect(Node.isChildApplicable(Node.getNodeDefUuid(nodeTreeDbh))(nodeTree)).to.be.equal(true)
  })
})
