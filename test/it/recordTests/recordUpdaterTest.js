const { expect } = require('chai')
const R = require('ramda')

const db = require('../../../server/db/db')

const Survey = require('../../../common/survey/survey')
const NodeDef = require('../../../common/survey/nodeDef')
const NodeDefExpression = require('../../../common/survey/nodeDefExpression')
const Record = require('../../../common/record/record')
const Node = require('../../../common/record/node')

const NodeDefRepository = require('../../../server/modules/nodeDef/persistence/nodeDefRepository')
const RecordManager = require('../../../server/modules/record/persistence/recordManager')
const RecordUpdateManager = require('../../../server/modules/record/persistence/recordUpdateManager')

const { getContextUser, fetchFullContextSurvey } = require('../../testContext')

const SB = require('../utils/surveyBuilder')
const RB = require('../utils/recordBuilder')

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
    expect(Node.getValue(reloadedNode)).to.equal(2)
  })
}

const calculatedValueUpdateTest = async () => {
  const survey = SB.survey(1, 'test', 'Test', 'en',
    SB.entity('root',
      SB.attribute('cluster_no', NodeDef.nodeDefType.integer)
        .key(),
      SB.attribute('num', NodeDef.nodeDefType.decimal),
      SB.attribute('double_num', NodeDef.nodeDefType.decimal)
        .readOnly()
        .defaultValues(NodeDefExpression.createExpression("this.parent().sibling('num').getValue() * 2"))
    )
  ).build()

  const record = RB.record(survey, this.getContextUser(),
    RB.entity('root',
      RB.attribute('cluster_no', 1),
      RB.attribute('num', 1),
      RB.attribute('double_num', 2),
    )
  ).build()

  
}

//==== helper methods
const newDefaultValue = (expression, applyIf = null) => NodeDefExpression.createExpression(expression, applyIf)

const newRecord = () => Record.newRecord(getContextUser())

module.exports = {
  recordCreationTest,
  defaultValueAppliedTest,
  calculatedValueUpdateTest
}