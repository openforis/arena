const { expect } = require('chai')
const R = require('ramda')

const db = require('../../../server/db/db')

const Survey = require('../../../common/survey/survey')
const { toUuidIndexedObj } = require('../../../common/survey/surveyUtils')
const NodeDef = require('../../../common/survey/nodeDef')
const NodeDefExpression = require('../../../common/survey/nodeDefExpression')
const Record = require('../../../common/record/record')
const Node = require('../../../common/record/node')

const NodeDefRepository = require('../../../server/modules/nodeDef/persistence/nodeDefRepository')
const RecordManager = require('../../../server/modules/record/persistence/recordManager')
const RecordUpdateManager = require('../../../server/modules/record/persistence/recordUpdateManager')

const { getContextUser, fetchFullContextSurvey } = require('../../testContext')

const updateDefaultValues = async (survey, nodeDef, defaultValueExpressions) => {
  const propsAdvanced = {
    [NodeDef.propKeys.defaultValues]: defaultValueExpressions
  }
  await NodeDefRepository.updateNodeDefProps(Survey.getId(survey), NodeDef.getUuid(nodeDef), {}, propsAdvanced)
}

const recordCreationTest = async () => {
  const survey = await fetchFullContextSurvey()
  const user = getContextUser()

  const recordNew = newRecord()

  const record = await new RecordUpdateManager.createRecord(user, survey, recordNew, db)
  const nodes = Record.getNodes(record)

  const reloadedRecord = RecordManager.fetchRecordByUuid(Survey.getId(survey), Record.getUuid(recordNew))

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
  const nodeDef = Survey.getNodeDefByPath(['node_def_text'])(survey)

  await updateDefaultValues(survey, nodeDef, defaultValues)

  survey = await fetchFullContextSurvey()

  //create record

  const record = newRecord()

  await db.tx(async t => {
    await new RecordUpdateManager.createRecord(user, survey, record, t)

    //reload record

    const reloadedRecord = RecordManager.fetchRecordAndNodesByUuid(Survey.getId(survey), Record.getUuid(record), t)

    const root = Record.getRootNode(reloadedRecord)

    const nodes = Record.getNodeChildrenByDefUuid(root, NodeDef.getUuid(nodeDef))(reloadedRecord)

    const reloadedNode = R.head(nodes)

    //compare value with default value
    expect(Node.getNodeValue(reloadedNode)).to.equal(2)
  })
}

//==== helper methods
const newDefaultValue = (expression, applyIf = null) => R.pipe(
  NodeDefExpression.assocExpression(expression),
  NodeDefExpression.assocApplyIf(applyIf)
)(NodeDefExpression.createExpressionPlaceholder())

const newRecord = () => Record.newRecord(getContextUser())

module.exports = {
  recordCreationTest,
  defaultValueAppliedTest,
}