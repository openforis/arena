const { expect } = require('chai')

const R = require('ramda')

const db = require('@server/db/db')

const Survey = require('@core/survey/survey')
const NodeDef = require('@core/survey/nodeDef')
const NodeDefExpression = require('@core/survey/nodeDefExpression')
const Record = require('@core/record/record')
const Node = require('@core/record/node')

const NodeDefRepository = require('@server/modules/nodeDef/repository/nodeDefRepository')
const RecordManager = require('@server/modules/record/manager/recordManager')

const { getContextUser, fetchFullContextSurvey } = require('../../testContext')

const RecordUtils = require('../utils/recordUtils')

const updateDefaultValues = async (survey, nodeDef, defaultValueExpressions) => {
  const propsAdvanced = {
    [NodeDef.propKeys.defaultValues]: defaultValueExpressions
  }
  await NodeDefRepository.updateNodeDefProps(Survey.getId(survey), NodeDef.getUuid(nodeDef), {}, propsAdvanced)
}

const recordCreationTest = async () => {
  const survey = await fetchFullContextSurvey()
  const user = getContextUser()
  const surveyId = Survey.getId(survey)

  const record = await RecordUtils.insertAndInitRecord(user, survey, true)

  const nodes = Record.getNodes(record)

  const reloadedRecord = await RecordManager.fetchRecordByUuid(surveyId, Record.getUuid(record))

  expect(reloadedRecord).to.not.be.undefined

  expect(R.isEmpty(nodes)).to.equal(false)
}

const defaultValueAppliedTest = async () => {
  let survey = await fetchFullContextSurvey()
  const user = getContextUser()

  //define default values
  const defaultValues = [
    newDefaultValue(`'default value 1'`, 'false'), //should not be applied
    newDefaultValue(`'default value 2'`)
  ]
  const nodeDef = Survey.getNodeDefByName('node_def_text')(survey)

  await updateDefaultValues(survey, nodeDef, defaultValues)

  survey = await fetchFullContextSurvey()

  //create record

  await db.tx(async t => {
    const record = await RecordUtils.insertAndInitRecord(user, survey, true, t)

    const root = Record.getRootNode(record)

    const nodes = Record.getNodeChildrenByDefUuid(root, NodeDef.getUuid(nodeDef))(record)

    const reloadedNode = R.head(nodes)

    //compare value with default value
    expect(Node.getValue(reloadedNode)).to.equal('default value 2')
  })
}

//==== helper methods
const newDefaultValue = (expression, applyIf = null) => NodeDefExpression.createExpression(expression, applyIf)

module.exports = {
  recordCreationTest,
  defaultValueAppliedTest
}

