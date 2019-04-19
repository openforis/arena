const { expect } = require('chai')

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

const updateNodeAndExpectDependentNodeValueToBe = async (survey, record, sourcePath, sourceValue, dependentPath, dependentExpectedValue) => {
  // update source node value
  const nodeSource = Record.findNodeByPath(sourcePath)(survey, record)

  const nodesUpdated = {
    [Node.getUuid(nodeSource)]: Node.assocValue(sourceValue)(nodeSource)
  }
  record = Record.assocNodes(nodesUpdated)(record)

  // update dependent nodes
  const nodesDependentUpdated = await NodeDependentUpdateManager.updateNodes(survey, record, nodesUpdated)
  record = Record.assocNodes(nodesDependentUpdated)(record)

  const nodeDependent = Record.findNodeByPath(dependentPath)(survey, record)

  expect(Node.getValue(nodeDependent)).to.equal(dependentExpectedValue)
  return record
}

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

  await updateNodeAndExpectDependentNodeValueToBe(survey, record, 'root/num', 2, 'root/double_num', 4)

  await SurveyManager.deleteSurvey(Survey.getId(survey))
}

const calculatedValueWithApplyIfUpdateTest = async () => {
  const user = getContextUser()

  const survey = await SB.survey(user, 'test', 'Test', 'en',
    SB.entity('cluster',
      SB.attribute('cluster_no', NodeDef.nodeDefType.integer)
        .key(),
      SB.attribute('num', NodeDef.nodeDefType.integer),
      SB.attribute('num_range')
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
    )
  ).buildAndStore()

  // test values, couples of expected values by input
  const testValues = [
    [-1, 'a'],
    [1, 'b'],
    [0, 'a'],
    [11, 'c'],
    [5, 'b'],
    [99, 'z'],
  ]

  for (const testValue of testValues) {
    const [sourceValue, expectedValue] = testValue

    record = await updateNodeAndExpectDependentNodeValueToBe(survey, record, 'root/num', sourceValue, 'root/num_range', expectedValue)
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

  await updateNodeAndExpectDependentNodeValueToBe(survey, record, 'root/num', 2, 'root/num_double_square', 16)

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