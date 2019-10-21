import { expect } from 'chai';
import Survey, { ISurvey } from '../../core/survey/survey';
import NodeDef from '../../core/survey/nodeDef';
import NodeDefExpression from '../../core/survey/nodeDefExpression';
import Record from '../../core/record/record';
import Node from '../../core/record/node';
import SurveyManager from '../../server/modules/survey/manager/surveyManager';
import RecordManager from '../../server/modules/record/manager/recordManager';
import { getContextUser } from '../testContext';
import * as SB from './utils/surveyBuilder';
import * as RB from './utils/recordBuilder';
import RecordUtils from './utils/recordUtils';
import db from '../../server/db/db';

let survey: ISurvey
let record: RB.IRecord

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

const updateNodeAndExpectDependentNodeValueToBe = async (
  survey: ISurvey, record: RB.IRecord,
  sourcePath: string, sourceValue: any,
  dependentPath: string, dependentExpectedValue: any,
) => {
  // update source node value
  const nodeSource = RecordUtils.findNodeByPath(sourcePath)(survey, record)

  const nodesUpdated = {
    [Node.getUuid(nodeSource)]: Node.assocValue(sourceValue)(nodeSource)
  }
  record = Record.assocNodes(nodesUpdated)(record)

  // update dependent nodes
  // TODO: added missing parameter db. Is this correct?
  const { record: recordUpdate } = await RecordManager.updateNodesDependents(survey, record, nodesUpdated, db)
  record = recordUpdate

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

    for (const [sourceValue, expectedValue] of testValues) {
      record = await updateNodeAndExpectDependentNodeValueToBe(
        survey, record, 'root/num', sourceValue, 'root/num_range', expectedValue)
    }
  })

  it('Calculated value cascade update', async () => {
    await updateNodeAndExpectDependentNodeValueToBe(survey, record, 'root/num', 2, 'root/num_double_square', 16)
  })
})
