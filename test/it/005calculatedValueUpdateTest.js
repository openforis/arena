import { expect } from 'chai'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as RecordManager from '@server/modules/record/manager/recordManager'

import { getContextUser } from '../testContext'

import * as SB from './utils/surveyBuilder'
import * as RB from './utils/recordBuilder'
import * as RecordUtils from './utils/recordUtils'

let survey
let record

const updateNodeAndExpectDependentNodeValueToBe = async (
  survey,
  record,
  sourcePath,
  sourceValue,
  dependentPath,
  dependentExpectedValue,
) => {
  // Update source node value
  const nodeSource = RecordUtils.findNodeByPath(sourcePath)(survey, record)

  const nodesUpdated = {
    [Node.getUuid(nodeSource)]: Node.assocValue(sourceValue)(nodeSource),
  }
  record = Record.assocNodes(nodesUpdated)(record)

  // Update dependent nodes
  const { record: recordUpdate } = await RecordManager.updateNodesDependents(
    survey,
    record,
    nodesUpdated,
  )
  record = recordUpdate

  const nodeDependent = RecordUtils.findNodeByPath(dependentPath)(
    survey,
    record,
  )

  expect(Node.getValue(nodeDependent)).to.equal(dependentExpectedValue)
  return record
}

describe('Calculated value test', () => {
  before(async () => {
    const user = getContextUser()

    survey = await SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_no', NodeDef.nodeDefType.integer).key(),
        SB.attribute('num', NodeDef.nodeDefType.decimal),
        SB.attribute('num_double', NodeDef.nodeDefType.decimal)
          .readOnly()
          .defaultValues(NodeDefExpression.createExpression('num * 2')),
        SB.attribute('num_double_square', NodeDef.nodeDefType.integer)
          .readOnly()
          .defaultValues(
            NodeDefExpression.createExpression('num_double * num_double'),
          ),
        SB.attribute('num_range')
          .readOnly()
          .defaultValues(
            NodeDefExpression.createExpression('"a"', 'num <= 0'),
            NodeDefExpression.createExpression('"b"', 'num <= 10'),
            NodeDefExpression.createExpression('"c"', 'num <= 20'),
            NodeDefExpression.createExpression('"z"'),
          ),
      ),
    ).buildAndStore()

    record = await RB.record(
      user,
      survey,
      RB.entity('root', RB.attribute('cluster_no', 1), RB.attribute('num', 1)),
    ).buildAndStore()
  })

  after(async () => {
    if (survey) {
      await SurveyManager.deleteSurvey(Survey.getId(survey))
    }
  })

  it('Calculated value updated', async () => {
    await updateNodeAndExpectDependentNodeValueToBe(
      survey,
      record,
      'root/num',
      2,
      'root/num_double',
      4,
    )
  })

  it('Calculated value with apply if updated', async () => {
    // Test values, couples of expected values by input
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

      record = await updateNodeAndExpectDependentNodeValueToBe(
        survey,
        record,
        'root/num',
        sourceValue,
        'root/num_range',
        expectedValue,
      )
    }
  })

  it('Calculated value cascade update', async () => {
    await updateNodeAndExpectDependentNodeValueToBe(
      survey,
      record,
      'root/num',
      2,
      'root/num_double_square',
      16,
    )
  })
})
