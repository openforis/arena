import { expect } from 'chai'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as Validation from '@core/validation/validation'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import { initTestContext, getContextUser } from '../testContext'

import * as SB from './utils/surveyBuilder'
import * as RB from './utils/recordBuilder'
import * as RecordUtils from './utils/recordUtils'

let survey = null
let record = null

const _persistNode = async node => {
  record = await RecordManager.persistNode(getContextUser(), survey, record, node)
}

const _deleteNode = async (parentNode, childNodeName, childNodePosition) => {
  const childDef = Survey.getNodeDefByName(childNodeName)(survey)
  const children = Record.getNodeChildrenByDefUuid(parentNode, NodeDef.getUuid(childDef))(record)
  const node = children[childNodePosition - 1]
  record = await RecordManager.deleteNode(getContextUser(), survey, record, Node.getUuid(node))
}

const updateNodeAndExpectValidationToBe = async (nodePath, value, validationExpected) => {
  const node = RecordUtils.findNodeByPath(nodePath)(survey, record)

  await _persistNode(Node.assocValue(value)(node))

  const nodeValidation = Validation.getFieldValidation(Node.getUuid(node))(Record.getValidation(record))

  expect(Validation.isValid(nodeValidation)).to.equal(validationExpected)
}

const deleteNodeAndExpectMinCountToBe = async (
  parentNodePath,
  childNodeName,
  childNodePosition,
  expectedValidation,
) => {
  const parentNode = RecordUtils.findNodeByPath(parentNodePath)(survey, record)
  const childDef = Survey.getNodeDefByName(childNodeName)(survey)

  await _deleteNode(parentNode, childNodeName, childNodePosition)

  const minCountValidation = RecordUtils.getValidationMinCount(parentNode, childDef)(record)

  expect(Validation.isValid(minCountValidation)).to.equal(expectedValidation)
}

const addNodeAndExpectCountToBe = async (parentNodePath, childNodeName, min = true, expectedValidation = true) => {
  const parentNode = RecordUtils.findNodeByPath(parentNodePath)(survey, record)
  const childDef = Survey.getNodeDefByName(childNodeName)(survey)

  const node = Node.newNode(NodeDef.getUuid(childDef), Record.getUuid(record), parentNode)

  await _persistNode(node)

  const countValidation = min
    ? RecordUtils.getValidationMinCount(parentNode, childDef)(record)
    : RecordUtils.getValidationMaxCount(parentNode, childDef)(record)

  expect(Validation.isValid(countValidation)).to.equal(expectedValidation)
}

const addNodeWithDuplicateKeyAndExpect2ValidationErrors = async () => {
  // Add a new tree
  const nodeRoot = Record.getRootNode(record)
  const nodeDefTree = Survey.getNodeDefByName('tree')(survey)
  const nodeTree = Node.newNode(NodeDef.getUuid(nodeDefTree), Record.getUuid(record), nodeRoot)
  await _persistNode(nodeTree)

  // Update new tree num with a duplicate value
  const nodeTreeNum = RecordUtils.findNodeByPath('cluster/tree[4]/tree_num')(survey, record)
  const value = 2 // Duplicate value
  await _persistNode(Node.assocValue(value)(nodeTreeNum))

  // Expect validation to be invalid
  const nodeTreeNumValidation = Validation.getFieldValidation(Node.getUuid(nodeTreeNum))(Record.getValidation(record))
  expect(Validation.isValid(nodeTreeNumValidation)).to.equal(false)

  // Expect duplicate node validation to be invalid
  const nodeTreeNumDuplicate = RecordUtils.findNodeByPath('cluster/tree[2]/tree_num')(survey, record)
  const nodeTreeNumDuplicateValidation = Validation.getFieldValidation(Node.getUuid(nodeTreeNumDuplicate))(
    Record.getValidation(record),
  )
  expect(Validation.isValid(nodeTreeNumDuplicateValidation)).to.equal(false)
}

const removeNodeWithDuplicateKeyAndExpectDuplicateNodeKeyToBeValid = async () => {
  await addNodeWithDuplicateKeyAndExpect2ValidationErrors()

  await _deleteNode(Record.getRootNode(record), 'tree', 4)

  const nodeTreeNumDuplicate = RecordUtils.findNodeByPath('cluster/tree[2]/tree_num')(survey, record)
  const nodeTreeNumDuplicateValidation = Validation.getFieldValidation(Node.getUuid(nodeTreeNumDuplicate))(
    Record.getValidation(record),
  )
  expect(Validation.isValid(nodeTreeNumDuplicateValidation)).to.equal(true)
}

describe('Record Validation Test', () => {
  before(async () => {
    await initTestContext()
    const user = getContextUser()

    survey = await SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_no').key(),
        SB.attribute('required_attr').required(),
        SB.attribute('not_required_attr').required(false),
        SB.attribute('numeric_attr', NodeDef.nodeDefType.integer),
        SB.attribute('date_attr', NodeDef.nodeDefType.date),
        SB.entity('tree', SB.attribute('tree_num', NodeDef.nodeDefType.integer).key())
          .multiple()
          .minCount(3)
          .maxCount(4),
        SB.attribute('percent_attr', NodeDef.nodeDefType.integer).expressions(
          NodeDefExpression.createExpression('percent_attr > 0'),
          NodeDefExpression.createExpression('percent_attr <= 100'),
        ),
      ),
    ).buildAndStore()

    record = await RB.record(
      user,
      survey,
      RB.entity(
        'cluster',
        RB.attribute('cluster_no', '1'),
        RB.attribute('required_attr', 'some value'),
        RB.attribute('not_required_attr', 'some other value'),
        RB.attribute('numeric_attr', 1),
        RB.attribute('date_attr', '01/01/2019'),
        RB.entity('tree', RB.attribute('tree_num', 1)),
        RB.entity('tree', RB.attribute('tree_num', 2)),
        RB.entity('tree', RB.attribute('tree_num', 3)),
      ),
    ).buildAndStore()
  })

  after(async () => {
    if (survey) {
      await SurveyManager.deleteSurvey(Survey.getId(survey))
    }
  })

  /*
    It('Invalid integer attribute value (text)', async () => {
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
    // 3 trees before => 2 trees after
    await deleteNodeAndExpectMinCountToBe('cluster', 'tree', 3, false)
  })

  it('Min count: correct number of nodes', async () => {
    // 2 trees before => 3 trees after
    await addNodeAndExpectCountToBe('cluster', 'tree', true, true)
  })

  // ========== max count

  it('Max count: correct number of nodes', async () => {
    // 3 trees before => 4 trees after
    await addNodeAndExpectCountToBe('cluster', 'tree', false, true)
  })

  it('Max count: exceeding maximum number of nodes', async () => {
    // 4 trees before => 5 trees after
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

  // ========== entity keys validation
  it('Entity Keys Validator : add entity with duplicate key and expect 2 validation errors', async () => {
    await addNodeWithDuplicateKeyAndExpect2ValidationErrors()
  })

  it('Entity Keys Validator : remove entity with duplicate key and expect duplicate node key to be valid', async () => {
    await removeNodeWithDuplicateKeyAndExpectDuplicateNodeKeyToBeValid()
  })
})
