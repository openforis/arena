const { expect } = require('chai')
const should = require('chai').should()

const R = require('ramda')

const NodeDef = require('../../../common/survey/nodeDef')
const NodeDefExpression = require('../../../common/survey/nodeDefExpression')
const Record = require('../../../common/record/record')
const Node = require('../../../common/record/node')

const NodeDependentUpdateManager = require('../../../server/modules/record/persistence/nodeDependentUpdateManager')

const { getContextUser } = require('../../testContext')

const SB = require('../utils/surveyBuilder')
const RB = require('../utils/recordBuilder')

const calculatedValueUpdateTest = async () => {
  const survey = SB.survey(1, 'test', 'Test', 'en',
    SB.entity('cluster',
      SB.attribute('cluster_no', NodeDef.nodeDefType.integer)
        .key(),
      SB.attribute('num', NodeDef.nodeDefType.decimal),
      SB.attribute('double_num', NodeDef.nodeDefType.decimal)
        .readOnly()
        .defaultValues(NodeDefExpression.createExpression('this.sibling(\'num\').getValue() * 2'))
    )
  ).build()

  let record = RB.record(survey, getContextUser(),
    RB.entity('root',
      RB.attribute('cluster_no', 1),
      RB.attribute('num', 1),
      RB.attribute('double_num', null),
    )
  ).build()

  const sourceNode = Record.findNodeByPath('root/num')(survey, record)

  const updatedNodes = {
    [Node.getUuid(sourceNode)]: Node.assocValue(2)(sourceNode)
  }
  record = Record.assocNodes(updatedNodes)(record)

  const nodeDependent = Record.findNodeByPath('root/double_num')(survey, record)

  const nodesDependentUpdated = await NodeDependentUpdateManager.updateNodes(survey, record, updatedNodes, null, false)

  const nodeDependentUpdated = R.prop(Node.getUuid(nodeDependent), nodesDependentUpdated)

  should.exist(nodeDependentUpdated)
  expect(Node.getValue(nodeDependentUpdated)).to.equal(4)
}

const calculatedValueWithApplyIfUpdateTest = async () => {
  const survey = SB.survey(1, 'test', 'Test', 'en',
    SB.entity('cluster',
      SB.attribute('cluster_no', NodeDef.nodeDefType.integer)
        .key(),
      SB.attribute('num', NodeDef.nodeDefType.decimal),
      SB.attribute('num_range', NodeDef.nodeDefType.decimal)
        .readOnly()
        .defaultValues(
          NodeDefExpression.createExpression('\'a\'', 'this.sibling(\'num\').getValue() <= 0'),
          NodeDefExpression.createExpression('\'b\'', 'this.sibling(\'num\').getValue() <= 10'),
          NodeDefExpression.createExpression('\'c\'', 'this.sibling(\'num\').getValue() <= 20'),
          NodeDefExpression.createExpression('\'z\'')
        )
    )
  ).build()

  let record = RB.record(survey, getContextUser(),
    RB.entity('root',
      RB.attribute('cluster_no', 1),
      RB.attribute('num', 1),
      RB.attribute('num_range', null),
    )
  ).build()

  // test values, couples of expected values by input
  const testValues = [
    [0, 'a'],
    [-1, 'a'],
    [1, 'b'],
    [5, 'b'],
    [11, 'c'],
    [99, 'z']
  ]

  const nodeSource = Record.findNodeByPath('root/num')(survey, record)
  const nodeDependent = Record.findNodeByPath('root/num_range')(survey, record)

  for (const testValue of testValues) {
    const [sourceValue, expectedValue] = testValue

    // update source node value
    const nodesUpdated = {
      [Node.getUuid(nodeSource)]: Node.assocValue(sourceValue)(nodeSource)
    }
    record = Record.assocNodes(nodesUpdated)(record)

    // update dependent nodes
    const nodesDependentUpdated = await NodeDependentUpdateManager.updateNodes(survey, record, nodesUpdated, null, false)

    const nodeDependentUpdated = R.prop(Node.getUuid(nodeDependent), nodesDependentUpdated)

    should.exist(nodeDependentUpdated)
    expect(Node.getValue(nodeDependentUpdated)).to.equal(expectedValue)
  }
}

const calculatedValueCascadeUpdateTest = async () => {
  const survey = SB.survey(1, 'test', 'Test', 'en',
    SB.entity('cluster',
      SB.attribute('cluster_no', NodeDef.nodeDefType.integer)
        .key(),
      SB.attribute('num', NodeDef.nodeDefType.decimal),
      SB.attribute('num_double', NodeDef.nodeDefType.decimal)
        .readOnly()
        .defaultValues(NodeDefExpression.createExpression('this.sibling(\'num\').getValue() * 2')),
      SB.attribute('num_double_square', NodeDef.nodeDefType.decimal)
        .readOnly()
        .defaultValues(NodeDefExpression.createExpression('this.sibling(\'num_double\').getValue() * this.sibling(\'num_double\').getValue()')),
    )
  ).build()

  let record = RB.record(survey, getContextUser(),
    RB.entity('root',
      RB.attribute('cluster_no', 1),
      RB.attribute('num', 1),
      RB.attribute('num_double', null),
      RB.attribute('num_double_square', null),
    )
  ).build()

  const sourceNode = Record.findNodeByPath('root/num')(survey, record)
  const nodeDependent = Record.findNodeByPath('root/num_double_square')(survey, record)

  const sourceValue = 2
  const dependentExpectedValue = 16

  const nodesUpdated = {
    [Node.getUuid(sourceNode)]: Node.assocValue(sourceValue)(sourceNode)
  }
  record = Record.assocNodes(nodesUpdated)(record)

  const nodesDependentUpdated = await NodeDependentUpdateManager.updateNodes(survey, record, nodesUpdated, null, false)

  const nodeDependentUpdated = R.prop(Node.getUuid(nodeDependent), nodesDependentUpdated)

  should.exist(nodeDependentUpdated)
  expect(Node.getValue(nodeDependentUpdated)).to.equal(dependentExpectedValue)
}


module.exports = {
  calculatedValueUpdateTest,
  calculatedValueWithApplyIfUpdateTest,
  calculatedValueCascadeUpdateTest
}