import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as PromiseUtils from '@core/promiseUtils'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as RecordManager from '@server/modules/record/manager/recordManager'

import { getContextUser } from '../config/context'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import * as RecordUtils from '../../utils/recordUtils'

const updateNodeAndExpectDependentNodeValueToBe = async (
  sourcePath,
  sourceValue,
  dependentPath,
  dependentExpectedValue
) => {
  const survey = global.applicableSurvey
  const record = global.applicableRecord
  // Update source node value
  const nodeSource = RecordUtils.findNodeByPath(sourcePath)(survey, record)

  const nodesUpdated = {
    [Node.getUuid(nodeSource)]: Node.assocValue(sourceValue)(nodeSource),
  }
  global.applicableRecord = Record.mergeNodes(nodesUpdated)(record)

  // Update dependent nodes
  const { record: recordUpdate } = await RecordManager.updateNodesDependents({ survey, record, nodes: nodesUpdated })
  global.applicableRecord = recordUpdate

  const nodeDependent = RecordUtils.findNodeByPath(dependentPath)(survey, record)

  expect(Node.getValue(nodeDependent)).toBe(dependentExpectedValue)
  return record
}

describe('Calculated value test', () => {
  beforeAll(async () => {
    const user = getContextUser()

    global.applicableSurvey = await SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_no', NodeDef.nodeDefType.integer).key(),
        SB.attribute('num', NodeDef.nodeDefType.decimal),
        SB.attribute('num_double', NodeDef.nodeDefType.decimal)
          .readOnly()
          .defaultValues(NodeDefExpression.createExpression({ expression: 'num * 2' })),
        SB.attribute('num_double_square', NodeDef.nodeDefType.integer)
          .readOnly()
          .defaultValues(NodeDefExpression.createExpression({ expression: 'num_double * num_double' })),
        SB.attribute('num_range')
          .readOnly()
          .defaultValues(
            NodeDefExpression.createExpression({ expression: '"a"', applyIf: 'num <= 0' }),
            NodeDefExpression.createExpression({ expression: '"b"', applyIf: 'num <= 10' }),
            NodeDefExpression.createExpression({ expression: '"c"', applyIf: 'num <= 20' }),
            NodeDefExpression.createExpression({ expression: '"z"' })
          )
      )
    ).buildAndStore()

    global.applicableRecord = await RB.record(
      user,
      global.applicableSurvey,
      RB.entity('cluster', RB.attribute('cluster_no', 1), RB.attribute('num', 1))
    ).buildAndStore()
  })

  afterAll(async () => {
    const survey = global.applicableSurvey

    if (survey) {
      await SurveyManager.deleteSurvey(Survey.getId(survey))
    }
  })

  test('Calculated value updated', async () => {
    await updateNodeAndExpectDependentNodeValueToBe('cluster/num', 2, 'cluster/num_double', 4)
  })

  test('Calculated value with apply if updated', async () => {
    // Test values, couples of expected values by input
    const testValues = [
      [-1, 'a'],
      [1, 'b'],
      [0, 'a'],
      [11, 'c'],
      [5, 'b'],
      [99, 'z'],
    ]

    await PromiseUtils.each(testValues, async (testValue) => {
      const [sourceValue, expectedValue] = testValue

      global.applicableRecord = await updateNodeAndExpectDependentNodeValueToBe(
        'cluster/num',
        sourceValue,
        'cluster/num_range',
        expectedValue
      )
    })
  })

  test('Calculated value cascade update', async () => {
    await updateNodeAndExpectDependentNodeValueToBe('cluster/num', 2, 'cluster/num_double_square', 16)
  })
})
