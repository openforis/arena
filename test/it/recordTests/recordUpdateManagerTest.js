const { expect } = require('chai')

const R = require('ramda')

const db = require('../../../server/db/db')

const Survey = require('../../../common/survey/survey')
const NodeDef = require('../../../common/survey/nodeDef')
const NodeDefExpression = require('../../../common/survey/nodeDefExpression')
const Record = require('../../../common/record/record')
const Node = require('../../../common/record/node')

const NodeDefRepository = require('../../../server/modules/nodeDef/repository/nodeDefRepository')
const RecordManager = require('../../../server/modules/record/persistence/recordManager')
const RecordUpdateManager = require('../../../server/modules/record/persistence/recordUpdateManager')

const { getContextUser, fetchFullContextSurvey, getContextSurveyId } = require('../../testContext')

const updateDefaultValues = async (survey, nodeDef, defaultValueExpressions) => {
  const propsAdvanced = {
    [NodeDef.propKeys.defaultValues]: defaultValueExpressions
  }
  await NodeDefRepository.updateNodeDefProps(Survey.getId(survey), NodeDef.getUuid(nodeDef), {}, propsAdvanced)
}

const recordCreationTest = async () => {
  const surveyId = getContextSurveyId()
  const user = getContextUser()

  const recordNew = newRecordPreview()

  const record = await RecordUpdateManager.createRecord(user, surveyId, recordNew)

  const nodes = Record.getNodes(record)

  const reloadedRecord = await RecordManager.fetchRecordByUuid(surveyId, Record.getUuid(recordNew))

  expect(reloadedRecord).to.not.be.undefined

  expect(R.isEmpty(nodes)).to.equal(false)
}

const defaultValueAppliedTest = async () => {
  let survey = await fetchFullContextSurvey()
  const user = getContextUser()

  //define default values
  const defaultValues = [
    newDefaultValue('1', 'false'), //should not be applied
    newDefaultValue('2')
  ]
  const nodeDef = Survey.getNodeDefByName('node_def_text')(survey)

  await updateDefaultValues(survey, nodeDef, defaultValues)

  survey = await fetchFullContextSurvey()

  const surveyId = Survey.getId(survey)

  //create record

  const record = newRecordPreview()

  await db.tx(async t => {
    await RecordUpdateManager.createRecord(user, surveyId, record, t)

    //reload record

    const reloadedRecord = await RecordManager.fetchRecordAndNodesByUuid(surveyId, Record.getUuid(record), t)

    const root = Record.getRootNode(reloadedRecord)

    const nodes = Record.getNodeChildrenByDefUuid(root, NodeDef.getUuid(nodeDef))(reloadedRecord)

    const reloadedNode = R.head(nodes)

    //compare value with default value
    expect(Node.getValue(reloadedNode)).to.equal(2)
  })
}

//==== helper methods
const newDefaultValue = (expression, applyIf = null) => NodeDefExpression.createExpression(expression, applyIf)

const newRecordPreview = () => Record.newRecord(getContextUser(), true)

module.exports = {
  recordCreationTest,
  defaultValueAppliedTest
}

