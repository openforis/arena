import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as RecordValidation from '@core/record/recordValidation'
import * as Validation from '@core/validation/validation'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import { initTestContext, getContextUser } from '../config/context'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import * as RecordUtils from '../../utils/recordUtils'

const getContext = () => {
  const survey = global.applicableSurvey
  const record = global.applicableRecord
  return { survey, record }
}
const _persistNode = async (node) => {
  const { survey, record } = getContext()
  global.applicableRecord = await RecordManager.persistNode({ user: getContextUser(), survey, record, node })
}

const _deleteNode = async (parentNode, childNodeName, childNodePosition) => {
  const { survey, record } = getContext()
  const childDef = Survey.getNodeDefByName(childNodeName)(survey)
  const children = Record.getNodeChildrenByDefUuid(parentNode, NodeDef.getUuid(childDef))(record)
  const node = children[childNodePosition - 1]
  global.applicableRecord = await RecordManager.deleteNode(getContextUser(), survey, record, Node.getUuid(node))
}

const _updateNodeAndExpectValidationToBe = async (nodePath, value, validationExpected) => {
  const { survey, record } = getContext()
  const node = RecordUtils.findNodeByPath(nodePath)(survey, record)

  await _persistNode(Node.assocValue(value)(node))

  const nodeValidation = Validation.getFieldValidation(Node.getUuid(node))(Record.getValidation(record))

  expect(Validation.isValid(nodeValidation)).toBe(validationExpected)
}

const _deleteNodeAndExpectCountToBe = async (parentNodePath, childNodeName, childNodePosition, expectedValidation) => {
  const { survey, record } = getContext()
  const parentNode = RecordUtils.findNodeByPath(parentNodePath)(survey, record)
  const childDef = Survey.getNodeDefByName(childNodeName)(survey)

  await _deleteNode(parentNode, childNodeName, childNodePosition)

  const validationCount = RecordUtils.getValidationChildrenCount(parentNode, childDef)(record)

  expect(Validation.isValid(validationCount)).toBe(expectedValidation)
}

const _addNodeAndExpectCountToBe = async (parentNodePath, childNodeName, expectedValidation) => {
  const { survey, record } = getContext()
  const parentNode = RecordUtils.findNodeByPath(parentNodePath)(survey, record)
  const childDef = Survey.getNodeDefByName(childNodeName)(survey)

  const node = Node.newNode(NodeDef.getUuid(childDef), Record.getUuid(record), parentNode)

  await _persistNode(node)

  const validationCount = RecordUtils.getValidationChildrenCount(parentNode, childDef)(record)

  expect(Validation.isValid(validationCount)).toBe(expectedValidation)
}

const _addNodeWithDuplicateKeyAndExpect2ValidationErrors = async () => {
  const { survey, record } = getContext()
  // Add a new plot
  const nodeRoot = Record.getRootNode(record)
  const nodeDefPlot = Survey.getNodeDefByName('plot')(survey)
  const nodePlot = Node.newNode(NodeDef.getUuid(nodeDefPlot), Record.getUuid(record), nodeRoot)
  await _persistNode(nodePlot)

  // Update new plot num with a duplicate value
  const nodePlotNum = RecordUtils.findNodeByPath('cluster/plot[4]/plot_num')(survey, record)
  const value = 2 // Duplicate value
  await _persistNode(Node.assocValue(value)(nodePlotNum))

  // Expect validation to be invalid
  const nodePlotNumValidation = Validation.getFieldValidation(Node.getUuid(nodePlotNum))(Record.getValidation(record))
  expect(Validation.isValid(nodePlotNumValidation)).toBe(false)

  // Expect duplicate node validation to be invalid
  const nodePlotNumDuplicate = RecordUtils.findNodeByPath('cluster/plot[2]/plot_num')(survey, record)
  const nodePlotNumDuplicateValidation = Validation.getFieldValidation(Node.getUuid(nodePlotNumDuplicate))(
    Record.getValidation(record)
  )
  expect(Validation.isValid(nodePlotNumDuplicateValidation)).toBe(false)
}

const _removeNodeWithDuplicateKeyAndExpectDuplicateNodeKeyToBeValid = async () => {
  const { survey, record } = getContext()
  await _addNodeWithDuplicateKeyAndExpect2ValidationErrors()

  await _deleteNode(Record.getRootNode(record), 'plot', 4)

  const nodePlotNumDuplicate = RecordUtils.findNodeByPath('cluster/plot[2]/plot_num')(survey, record)
  const nodePlotNumDuplicateValidation = Validation.getFieldValidation(Node.getUuid(nodePlotNumDuplicate))(
    Record.getValidation(record)
  )
  expect(Validation.isValid(nodePlotNumDuplicateValidation)).toBe(true)
}

describe('Record Validation Test', () => {
  beforeAll(async () => {
    await initTestContext()
    const user = getContextUser()

    global.applicableSurvey = await SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_no').key(),
        SB.attribute('required_attr').required(),
        SB.attribute('not_required_attr').required(false),
        SB.attribute('numeric_attr', NodeDef.nodeDefType.integer),
        SB.attribute('cluster_start_date', NodeDef.nodeDefType.date),
        SB.attribute('cluster_start_time', NodeDef.nodeDefType.time),
        SB.entity(
          'plot',
          SB.attribute('plot_num', NodeDef.nodeDefType.integer).key(),
          SB.entity(
            'tree',
            SB.attribute('tree_num', NodeDef.nodeDefType.integer).key().required(),
            SB.attribute('tree_start_time', NodeDef.nodeDefType.time)
              .required()
              .expressions(NodeDefExpression.createExpression({ expression: 'tree_start_time > cluster_start_time' }))
          )
            .multiple()
            .minCount(1)
        )
          .multiple()
          .minCount(3)
          .maxCount(4),
        SB.attribute('percent_attr', NodeDef.nodeDefType.integer).expressions(
          NodeDefExpression.createExpression({ expression: 'percent_attr > 0' }),
          NodeDefExpression.createExpression({ expression: 'percent_attr <= 100' })
        )
      )
    ).buildAndStore()

    global.applicableRecord = await RB.record(
      user,
      global.applicableSurvey,
      RB.entity(
        'cluster',
        RB.attribute('cluster_no', '1'),
        RB.attribute('required_attr', 'some value'),
        RB.attribute('not_required_attr', 'some other value'),
        RB.attribute('numeric_attr', 1),
        RB.attribute('cluster_start_date', '01/01/2019'),
        RB.attribute('cluster_start_time', '09:00'),
        RB.entity('plot', RB.attribute('plot_num', 1)),
        RB.entity('plot', RB.attribute('plot_num', 2)),
        RB.entity('plot', RB.attribute('plot_num', 3))
      )
    ).buildAndStore()
  })

  afterAll(async () => {
    const { survey } = getContext()
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

  test('Invalid integer attribute value (decimal)', async () => {
    await _updateNodeAndExpectValidationToBe('cluster/numeric_attr', 1.2, false)
  })

  test('Correct date attribute value', async () => {
    await _updateNodeAndExpectValidationToBe('cluster/cluster_start_date', '02/11/2019', true)
  })

  test('Invalid date attribute value (day)', async () => {
    await _updateNodeAndExpectValidationToBe('cluster/cluster_start_date', '32/01/2019', false)
  })

  test('Invalid date attribute value (month)', async () => {
    await _updateNodeAndExpectValidationToBe('cluster/cluster_start_date', '01/13/2019', false)
  })

  // ========== required

  test('Required attribute: missing value', async () => {
    await _updateNodeAndExpectValidationToBe('cluster/required_attr', null, false)
  })

  test('Required attribute: empty value', async () => {
    await _updateNodeAndExpectValidationToBe('cluster/required_attr', '', false)
  })

  test('Required attribute: not empty value', async () => {
    await _updateNodeAndExpectValidationToBe('cluster/required_attr', 'some value', true)
  })

  test('Not required attribute: missing value', async () => {
    await _updateNodeAndExpectValidationToBe('cluster/not_required_attr', null, true)
  })

  test('Not required attribute: empty value', async () => {
    await _updateNodeAndExpectValidationToBe('cluster/not_required_attr', '', true)
  })

  test('Not required attribute: not empty value', async () => {
    await _updateNodeAndExpectValidationToBe('cluster/not_required_attr', 'some value', true)
  })

  // ========== min count

  test('Min count: missing nodes', async () => {
    // 3 plots before => 2 plots after
    await _deleteNodeAndExpectCountToBe('cluster', 'plot', 3, false)
  })

  test('Min count: correct number of nodes', async () => {
    // 2 plots before => 3 plots after
    await _addNodeAndExpectCountToBe('cluster', 'plot', true)
  })

  // ========== max count

  test('Max count: correct number of nodes', async () => {
    // 3 plots before => 4 plots after
    await _addNodeAndExpectCountToBe('cluster', 'plot', true)
  })

  test('Max count: exceeding maximum number of nodes', async () => {
    // 4 plots before => 5 plots after
    await _addNodeAndExpectCountToBe('cluster', 'plot', false)
  })

  // ========== children count validation deletion

  test('Children count: descendant children count validation deleted on node deletion', async () => {
    const { survey, record } = getContext()
    // 5 plots before => 4 plots after
    const nodeParent = RecordUtils.findNodeByPath('cluster/plot[5]')(survey, record)
    const nodeDefChild = Survey.getNodeDefByName('tree')(survey)
    const validationCount = R.pipe(
      Record.getValidation,
      RecordValidation.getValidationChildrenCount(Node.getUuid(nodeParent), NodeDef.getUuid(nodeDefChild))
    )(record)
    expect(Validation.isValid(validationCount)).toBe(false) // Min count = 1

    await _deleteNode(Record.getParentNode(nodeParent)(record), 'plot', 5)

    const validationCountUpdated = R.path(
      [
        Validation.keys.validation,
        Validation.keys.fields,
        RecordValidation.getValidationChildrenCountKey(Node.getUuid(nodeParent), NodeDef.getUuid(nodeDefChild)),
      ],
      record
    )
    // Children count validation should be deleted
    /* eslint-disable no-unused-expressions */
    expect(validationCountUpdated).toBeUndefined()
  })

  // ========== expressions

  test('Expressions : invalid value (lower than min)', async () => {
    await _updateNodeAndExpectValidationToBe('cluster/percent_attr', 0, false)
  })

  test('Expressions : valid value', async () => {
    await _updateNodeAndExpectValidationToBe('cluster/percent_attr', 50, true)
  })

  test('Expressions : invalid value (higher than max)', async () => {
    await _updateNodeAndExpectValidationToBe('cluster/percent_attr', 120, false)
  })

  test('Expressions : reference to ancestor attribute (valid value)', async () => {
    // insert a new tree
    await _addNodeAndExpectCountToBe('cluster/plot[1]', 'tree', true)
    // update tree_start_time value
    await _updateNodeAndExpectValidationToBe('cluster/plot[1]/tree[1]/tree_start_time', '10:20', true)
  })

  test('Expressions : reference to ancestor attribute (invalid value)', async () => {
    await _updateNodeAndExpectValidationToBe('cluster/plot[1]/tree[1]/tree_start_time', '08:20', false)
  })

  // ========== entity keys validation
  test('Entity Keys Validator : add entity with duplicate key and expect 2 validation errors', async () => {
    await _addNodeWithDuplicateKeyAndExpect2ValidationErrors()
  })

  test('Entity Keys Validator : remove entity with duplicate key and expect duplicate node key to be valid', async () => {
    await _removeNodeWithDuplicateKeyAndExpectDuplicateNodeKeyToBeValid()
  })
})
