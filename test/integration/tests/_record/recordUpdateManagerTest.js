import * as R from 'ramda'

import { db } from '@server/db/db'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import * as NodeDefRepository from '@server/modules/nodeDef/repository/nodeDefRepository'
import * as RecordManager from '@server/modules/record/manager/recordManager'

import { getContextUser, fetchFullContextSurvey } from '../../config/context'

import * as RecordUtils from '../../../utils/recordUtils'

// ==== helper methods
const newDefaultValue = (expression, applyIf = null) => NodeDefExpression.createExpression({ expression, applyIf })

const updateDefaultValues = async (survey, nodeDef, defaultValueExpressions) => {
  const propsAdvanced = {
    [NodeDef.keysPropsAdvanced.defaultValues]: defaultValueExpressions,
  }
  await NodeDefRepository.updateNodeDefProps({
    surveyId: Survey.getId(survey),
    nodeDefUuid: NodeDef.getUuid(nodeDef),
    parentUuid: NodeDef.getParentUuid(nodeDef),
    props: {},
    propsAdvanced,
  })
}

export const recordCreationTest = async () => {
  const survey = await fetchFullContextSurvey()
  const user = getContextUser()
  const surveyId = Survey.getId(survey)

  const record = await RecordUtils.insertAndInitRecord(user, survey, true)

  const nodes = Record.getNodes(record)

  const reloadedRecord = await RecordManager.fetchRecordByUuid(surveyId, Record.getUuid(record))

  /* eslint-disable no-unused-expressions */
  expect(reloadedRecord).toBeDefined()

  expect(R.isEmpty(nodes)).toBe(false)
}

export const defaultValueAppliedTest = async () => {
  let survey = await fetchFullContextSurvey()
  const user = getContextUser()

  // Define default values
  const defaultValues = [
    newDefaultValue("'default value 1'", 'false'), // Should not be applied
    newDefaultValue("'default value 2'"),
  ]
  const nodeDef = Survey.getNodeDefByName('node_def_text')(survey)

  await updateDefaultValues(survey, nodeDef, defaultValues)

  survey = await fetchFullContextSurvey()

  // Create record

  await db.tx(async (t) => {
    const record = await RecordUtils.insertAndInitRecord(user, survey, true, t)

    const root = Record.getRootNode(record)

    const nodes = Record.getNodeChildrenByDefUuid(root, NodeDef.getUuid(nodeDef))(record)

    const reloadedNode = R.head(nodes)

    // Compare value with default value
    expect(Node.getValue(reloadedNode)).toBe('default value 2')
  })
}
