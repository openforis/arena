const { expect } = require('chai')
const should = require('chai').should()

const R = require('ramda')

const Survey = require('../../../common/survey/survey')
const NodeDef = require('../../../common/survey/nodeDef')
const NodeDefExpression = require('../../../common/survey/nodeDefExpression')
const Record = require('../../../common/record/record')
const Node = require('../../../common/record/node')

const SurveyManager = require('../../../server/modules/survey/persistence/surveyManager')
const NodeDependentUpdateManager = require('../../../server/modules/record/persistence/nodeDependentUpdateManager')

const { getContextUser } = require('../../testContext')

const SB = require('../utils/surveyBuilder')
const RB = require('../utils/recordBuilder')

const calculatedValueUpdateTest = async () => {
  const user = getContextUser()

  const survey = await SB.survey(user, 'test', 'Test', 'en',
    SB.entity('cluster',
      SB.attribute('cluster_no', NodeDef.nodeDefType.integer)
        .key(),
      SB.attribute('num', NodeDef.nodeDefType.decimal),
      SB.attribute('double_num', NodeDef.nodeDefType.decimal)
        .readOnly()
        .defaultValues(NodeDefExpression.createExpression(`this.sibling('num').getValue() * 2`))
    )
  ).buildAndStore()

  let record = await RB.record(user, survey,
    RB.entity('root',
      RB.attribute('cluster_no', 1),
      RB.attribute('num', 1),
      RB.attribute('double_num', null),
    )
  ).buildAndStore()

  const sourceNode = Record.findNodeByPath('root/num')(survey, record)

  const updatedNodes = {
    [Node.getUuid(sourceNode)]: Node.assocValue(2)(sourceNode)
  }
  record = Record.assocNodes(updatedNodes)(record)

  const nodeDependent = Record.findNodeByPath('root/double_num')(survey, record)

  const nodesDependentUpdated = await NodeDependentUpdateManager.updateNodes(survey, record, updatedNodes)

  const nodeDependentUpdated = R.prop(Node.getUuid(nodeDependent), nodesDependentUpdated)

  should.exist(nodeDependentUpdated)
  expect(Node.getValue(nodeDependentUpdated)).to.equal(4)

  await SurveyManager.deleteSurvey(Survey.getId(survey))
}

const calculatedValueWithApplyIfUpdateTest = async () => {
  const user = getContextUser()

  const survey = await SB.survey(user, 'test', 'Test', 'en',
    SB.entity('cluster',
      SB.attribute('cluster_no', NodeDef.nodeDefType.integer)
        .key(),
      SB.attribute('num', NodeDef.nodeDefType.integer),
      SB.attribute('num_range', NodeDef.nodeDefType.text)
        .readOnly()
        .defaultValues(
          NodeDefExpression.createExpression('a', `this.sibling('num').getValue() <= 0`),
          NodeDefExpression.createExpression('b', `this.sibling('num').getValue() <= 10`),
          NodeDefExpression.createExpression('c', `this.sibling('num').getValue() <= 20`),
          NodeDefExpression.createExpression('z')
        )
    )
  ).buildAndStore()

  let record = await RB.record(user, survey,
    RB.entity('root',
      RB.attribute('cluster_no', 1),
      RB.attribute('num', 1),
      RB.attribute('num_range', null),
    )
  ).buildAndStore()

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
    const nodesDependentUpdated = await NodeDependentUpdateManager.updateNodes(survey, record, nodesUpdated)

    const nodeDependentUpdated = R.prop(Node.getUuid(nodeDependent), nodesDependentUpdated)

    should.exist(nodeDependentUpdated)
    expect(Node.getValue(nodeDependentUpdated)).to.equal(expectedValue)
  }

  await SurveyManager.deleteSurvey(Survey.getId(survey))
}

const calculatedValueCascadeUpdateTest = async () => {
  const user = getContextUser()

  const survey = await SB.survey(user, 'test', 'Test', 'en',
    SB.entity('cluster',
      SB.attribute('cluster_no', NodeDef.nodeDefType.integer)
        .key(),
      SB.attribute('num', NodeDef.nodeDefType.integer),
      SB.attribute('num_double', NodeDef.nodeDefType.integer)
        .readOnly()
        .defaultValues(NodeDefExpression.createExpression(`this.sibling('num').getValue() * 2`)),
      SB.attribute('num_double_square', NodeDef.nodeDefType.integer)
        .readOnly()
        .defaultValues(NodeDefExpression.createExpression(`this.sibling('num_double').getValue() * this.sibling('num_double').getValue()`)),
    )
  ).buildAndStore()

  let record = await RB.record(user, survey,
    RB.entity('root',
      RB.attribute('cluster_no', 1),
      RB.attribute('num', 1),
      RB.attribute('num_double', null),
      RB.attribute('num_double_square', null),
    )
  ).buildAndStore()

  const sourceNode = Record.findNodeByPath('root/num')(survey, record)
  const nodeDependent = Record.findNodeByPath('root/num_double_square')(survey, record)

  const sourceValue = 2
  const dependentExpectedValue = 16

  const nodesUpdated = {
    [Node.getUuid(sourceNode)]: Node.assocValue(sourceValue)(sourceNode)
  }
  record = Record.assocNodes(nodesUpdated)(record)

  const nodesDependentUpdated = await NodeDependentUpdateManager.updateNodes(survey, record, nodesUpdated)

  const nodeDependentUpdated = R.prop(Node.getUuid(nodeDependent), nodesDependentUpdated)

  should.exist(nodeDependentUpdated)
  expect(Node.getValue(nodeDependentUpdated)).to.equal(dependentExpectedValue)

  await SurveyManager.deleteSurvey(Survey.getId(survey))
}

const applyIfUpdateTest = async () => {
  const user = getContextUser()

  const survey = await SB.survey(user, 'test', 'Test', 'en',
    SB.entity('cluster',
      SB.attribute('cluster_no', NodeDef.nodeDefType.integer)
        .key(),
      SB.attribute('num', NodeDef.nodeDefType.decimal),
      SB.attribute('dependent_node')
        .applyIf(`this.node('num').getValue() > 100`)
    )
  ).buildAndStore()

  let record = await RB.record(user, survey,
    RB.entity('root',
      RB.attribute('cluster_no', 1),
      RB.attribute('num', 1),
      RB.attribute('dependent_node', null),
    )
  ).buildAndStore()

  const nodeSource = Record.findNodeByPath('root/num')(survey, record)
  const nodeDependent = Record.findNodeByPath('root/dependent_node')(survey, record)
  const nodeDependentParent = Record.getParentNode(nodeDependent)(record)
  const nodeDependentParentUuid = Node.getUuid(nodeDependentParent)
  const nodeDependentDefUuid = Node.getNodeDefUuid(nodeDependent)

  // test values, couples of expected values by input
  const testValues = [
    [10, false],
    [100, false],
    [101, true],
    [1000, true],
    [50, false],
  ]

  for (const testValue of testValues) {
    const [sourceValue, expectedValue] = testValue

    // update source node value
    const nodesUpdated = {
      [Node.getUuid(nodeSource)]: Node.assocValue(sourceValue)(nodeSource)
    }
    record = Record.assocNodes(nodesUpdated)(record)

    // update dependent nodes
    const nodesDependentUpdated = await NodeDependentUpdateManager.updateNodes(survey, record, nodesUpdated)

    record = Record.assocNodes(nodesDependentUpdated)(record)

    const nodeDependentParentUpdated = Record.getNodeByUuid(nodeDependentParentUuid)(record)

    const applicable = Node.isChildApplicable(nodeDependentDefUuid)(nodeDependentParentUpdated)

    expect(applicable).to.equal(expectedValue)
  }

  await SurveyManager.deleteSurvey(Survey.getId(survey))
}

module.exports = {
  calculatedValueUpdateTest,
  calculatedValueWithApplyIfUpdateTest,
  calculatedValueCascadeUpdateTest,

  applyIfUpdateTest
}