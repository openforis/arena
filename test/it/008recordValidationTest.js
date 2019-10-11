const { expect } = require('chai')

const { getContextUser } = require('../testContext')

const Survey = require('../../core/survey/survey')
const NodeDef = require('../../core/survey/nodeDef')
const NodeDefExpression = require('../../core/survey/nodeDefExpression')
const Record = require('../../core/record/record')
const Node = require('../../core/record/node')
const Validation = require('../../core/validation/validation')

const SurveyManager = require('../../server/modules/survey/manager/surveyManager')
const RecordManager = require('../../server/modules/record/manager/recordManager')

const SB = require('./utils/surveyBuilder')
const RB = require('./utils/recordBuilder')
const RecordUtils = require('./utils/recordUtils')

let survey = null
let record = null

before(async () => {
  const user = getContextUser()

  survey = await SB.survey(user,
    SB.entity('cluster',
      SB.attribute('cluster_no')
        .key(),
      SB.attribute('required_attr')
        .required(),
      SB.attribute('not_required_attr')
        .required(false),
      SB.attribute('numeric_attr', NodeDef.nodeDefType.integer),
      SB.attribute('date_attr', NodeDef.nodeDefType.date),
      SB.entity('tree',
        SB.attribute('tree_num', NodeDef.nodeDefType.integer)
          .key()
      ).multiple()
        .minCount(3)
        .maxCount(4),
      SB.attribute('percent_attr', NodeDef.nodeDefType.integer)
        .expressions(
          NodeDefExpression.createExpression('this.getValue() > 0'),
          NodeDefExpression.createExpression('this.getValue() <= 100')
        )
    )
  ).buildAndStore()

  record = await RB.record(user, survey,
    RB.entity('root',
      RB.attribute('cluster_no', '1'),
      RB.attribute('required_attr', 'some value'),
      RB.attribute('not_required_attr', 'some other value'),
      RB.attribute('numeric_attr', 1),
      RB.attribute('date_attr', '01/01/2019'),
      RB.entity('tree',
        RB.attribute('tree_num', 1)
      ),
      RB.entity('tree',
        RB.attribute('tree_num', 2)
      ),
      RB.entity('tree',
        RB.attribute('tree_num', 3)
      )
    )
  ).buildAndStore()
})

after(async () => {
  if (survey)
    await SurveyManager.deleteSurvey(Survey.getId(survey))
})

const deleteNode = async (parentNode, childNodeName, childNodePosition) => {
  const childDef = Survey.getNodeDefByName(childNodeName)(survey)
  const children = Record.getNodeChildrenByDefUuid(parentNode, NodeDef.getUuid(childDef))(record)
  const node = children[childNodePosition - 1]
  record = await RecordManager.deleteNode(getContextUser(), survey, record, Node.getUuid(node))
  return record
}

const updateNodeAndExpectValidationToBe = async (nodePath, value, validationExpected) => {
  const node = RecordUtils.findNodeByPath(nodePath)(survey, record)

  record = await RecordManager.persistNode(getContextUser(), survey, record, Node.assocValue(value)(node))

  const nodeValidation = Validation.getFieldValidation(Node.getUuid(node))(Record.getValidation(record))

  expect(Validation.isValid(nodeValidation)).to.equal(validationExpected)
}

const deleteNodeAndExpectMinCountToBe = async (parentNodePath, childNodeName, childNodePosition, expectedValidation) => {
  const parentNode = RecordUtils.findNodeByPath(parentNodePath)(survey, record)
  const childDef = Survey.getNodeDefByName(childNodeName)(survey)

  record = await deleteNode(parentNode, childNodeName, childNodePosition)

  const minCountValidation = RecordUtils.getValidationMinCount(parentNode, childDef)(record)

  expect(Validation.isValid(minCountValidation)).to.equal(expectedValidation)
}

const addNodeAndExpectCountToBe = async (parentNodePath, childNodeName, min = true, expectedValidation = true) => {
  const parentNode = RecordUtils.findNodeByPath(parentNodePath)(survey, record)
  const childDef = Survey.getNodeDefByName(childNodeName)(survey)

  const node = Node.newNode(NodeDef.getUuid(childDef), Record.getUuid(record), parentNode)

  record = await RecordManager.persistNode(getContextUser(), survey, record, node)

  const countValidation = min
    ? RecordUtils.getValidationMinCount(parentNode, childDef)(record)
    : RecordUtils.getValidationMaxCount(parentNode, childDef)(record)

  expect(Validation.isValid(countValidation)).to.equal(expectedValidation)
}

describe('Record Validation Test', async () => {

  /*
    it('Invalid integer attribute value (text)', async () => {
      await updateNodeAndExpectValidationToBe('cluster/numeric_attr', 'text value', false)
    })
  */

  // ========== data types

  it('Invalid integer attribute value (decimal)', async () => {
    await updateNodeAndExpectValidationToBe('cluster/numeric_attr', 1.2, false)
  })

  it('Correct date attribute value', async () => {
    await updateNodeAndExpectValidationToBe('cluster/date_attr', '02/11/2019', true)
  })

  it('Invalid date attribute value (day)', async () => {
    await updateNodeAndExpectValidationToBe('cluster/date_attr', '32/01/2019', false)
  })

  it('Invalid date attribute value (month)', async () => {
    await updateNodeAndExpectValidationToBe('cluster/date_attr', '01/13/2019', false)
  })

  // ========== required

  it('Required attribute: missing value', async () => {
    await updateNodeAndExpectValidationToBe('cluster/required_attr', null, false)
  })

  it('Required attribute: empty value', async () => {
    await updateNodeAndExpectValidationToBe('cluster/required_attr', '', false)
  })

  it('Required attribute: not empty value', async () => {
    await updateNodeAndExpectValidationToBe('cluster/required_attr', 'some value', true)
  })

  it('Not required attribute: missing value', async () => {
    await updateNodeAndExpectValidationToBe('cluster/not_required_attr', null, true)
  })

  it('Not required attribute: empty value', async () => {
    await updateNodeAndExpectValidationToBe('cluster/not_required_attr', '', true)
  })

  it('Not required attribute: not empty value', async () => {
    await updateNodeAndExpectValidationToBe('cluster/not_required_attr', 'some value', true)
  })

  // ========== min count

  it('Min count: missing nodes', async () => {
    //3 trees before => 2 trees after
    await deleteNodeAndExpectMinCountToBe('cluster', 'tree', 3, false)
  })

  it('Min count: correct number of nodes', async () => {
    //2 trees before => 3 trees after
    await addNodeAndExpectCountToBe('cluster', 'tree', true, true)
  })

  // ========== max count

  it('Max count: correct number of nodes', async () => {
    //3 trees before => 4 trees after
    await addNodeAndExpectCountToBe('cluster', 'tree', false, true)
  })

  it('Max count: exceeding maximum number of nodes', async () => {
    //4 trees before => 5 trees after
    await addNodeAndExpectCountToBe('cluster', 'tree', false, false)
  })

  // ========== expressions

  it('Expressions : invalid value (lower than min)', async () => {
    await updateNodeAndExpectValidationToBe('cluster/percent_attr', 0, false)
  })

  it('Expressions : valid value', async () => {
    await updateNodeAndExpectValidationToBe('cluster/percent_attr', 50, true)
  })

  it('Expressions : invalid value (higher than max)', async () => {
    await updateNodeAndExpectValidationToBe('cluster/percent_attr', 120, false)
  })
})