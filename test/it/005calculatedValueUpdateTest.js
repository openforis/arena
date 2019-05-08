const { expect } = require('chai')

const Survey = require('../../common/survey/survey')
const NodeDef = require('../../common/survey/nodeDef')
const NodeDefExpression = require('../../common/survey/nodeDefExpression')
const Record = require('../../common/record/record')
const Node = require('../../common/record/node')

const SurveyManager = require('../../server/modules/survey/manager/surveyManager')
const NodeDependentUpdateManager = require('../../server/modules/record/manager/nodeDependentUpdateManager')

const { getContextUser } = require('../testContext')

const SB = require('./utils/surveyBuilder')
const RB = require('./utils/recordBuilder')
const RecordUtils = require('./utils/recordUtils')

let survey
let record

before(async () => {
  const user = getContextUser()

  survey = await SB.survey(user,
    SB.entity('cluster',
      SB.attribute('cluster_no', NodeDef.nodeDefType.integer)
        .key(),
      SB.attribute('num', NodeDef.nodeDefType.decimal),
      SB.attribute('num_double', NodeDef.nodeDefType.decimal)
        .readOnly()
        .defaultValues(NodeDefExpression.createExpression(`this.sibling('num').getValue() * 2`)),
      SB.attribute('num_double_square', NodeDef.nodeDefType.integer)
        .readOnly()
        .defaultValues(NodeDefExpression.createExpression(`this.sibling('num_double').getValue() * this.sibling('num_double').getValue()`)),
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

  record = await RB.record(user, survey,
    RB.entity('root',
      RB.attribute('cluster_no', 1),
      RB.attribute('num', 1),
    )
  ).buildAndStore()
})

after(async () => {
  if (survey)
    await SurveyManager.deleteSurvey(Survey.getId(survey))
})

const updateNodeAndExpectDependentNodeValueToBe = async (survey, record, sourcePath, sourceValue, dependentPath, dependentExpectedValue) => {
  // update source node value
  const nodeSource = RecordUtils.findNodeByPath(sourcePath)(survey, record)

  const nodesUpdated = {
    [Node.getUuid(nodeSource)]: Node.assocValue(sourceValue)(nodeSource)
  }
  record = Record.assocNodes(nodesUpdated)(record)

  // update dependent nodes
  const nodesDependentUpdated = await NodeDependentUpdateManager.updateNodes(survey, record, nodesUpdated)
  record = Record.assocNodes(nodesDependentUpdated)(record)

  const nodeDependent = RecordUtils.findNodeByPath(dependentPath)(survey, record)

  expect(Node.getValue(nodeDependent)).to.equal(dependentExpectedValue)
  return record
}

describe('Calculated value test', async () => {

  it('Calculated value updated', async () => {
    await updateNodeAndExpectDependentNodeValueToBe(survey, record, 'root/num', 2, 'root/num_double', 4)
  })

  it('Calculated value with apply if updated', async () => {
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
  })

  it('Calculated value cascade update', async () => {
    await updateNodeAndExpectDependentNodeValueToBe(survey, record, 'root/num', 2, 'root/num_double_square', 16)
  })
})