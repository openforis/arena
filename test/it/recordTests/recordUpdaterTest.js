const {expect} = require('chai')
const R = require('ramda')

const db = require('../../../server/db/db')

const Survey = require('../../../common/survey/survey')
const {toUuidIndexedObj} = require('../../../common/survey/surveyUtils')
const NodeDef = require('../../../common/survey/nodeDef')
const NodeDefExpression = require('../../../common/survey/nodeDefExpression')
const Record = require('../../../common/record/record')
const Node = require('../../../common/record/node')

const NodeDefRepository = require('../../../server/nodeDef/nodeDefRepository')
const NodeRepository = require('../../../server/record/nodeRepository')
const RecordRepository = require('../../../server/record/recordRepository')
const RecordUpdater = require('../../../server/record/update/thread/helpers/recordUpdater')

const {getContextUser, getContextSurvey, fetchFullContextSurvey} = require('../../testContext')

const updateDefaultValues = async (survey, nodeDef, defaultValueExpressions) => {
  await NodeDefRepository.updateNodeDefProps(Survey.getId(survey), NodeDef.getUuid(nodeDef),
    [{key: NodeDef.propKeys.defaultValues, value: defaultValueExpressions, advanced: true}])
}

const recordCreationTest = async () => {
  const survey = await fetchFullContextSurvey()
  const user = getContextUser()

  const record = newRecord()

  const nodes = await new RecordUpdater().createRecord(user, survey, record, db)

  const reloadedRecord = RecordRepository.fetchRecordByUuid(Survey.getId(survey), Record.getUuid(record))

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
    await new RecordUpdater().createRecord(user, survey, record, t)

    //reload record

    const reloadedNodes = await NodeRepository.fetchNodesByRecordUuid(Survey.getId(survey), Record.getUuid(record), t)

    const reloadedRecord = {...record, nodes: toUuidIndexedObj(reloadedNodes)}

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

const newRecord = () => {
  const user = getContextUser()
  const survey = getContextSurvey()
  const surveyInfo = Survey.getSurveyInfo(survey)
  const defaultStep = Survey.getDefaultStep(surveyInfo)
  return Record.newRecord(user, defaultStep)
}

module.exports = {
  recordCreationTest,
  defaultValueAppliedTest,
}