const {getContextSurvey, fetchFullContextSurvey} = require('./../../testContext')
const {assert, expect} = require('chai')
const R = require('ramda')

const Survey = require('../../../common/survey/survey')
const NodeDef = require('../../../common/survey/nodeDef')
const NodeDefExpression = require('../../../common/survey/nodeDefExpression')

const NodeDefRepository = require('../../../server/nodeDef/nodeDefRepository')

const fetchRootNodeDef = async () => {
  const survey = getContextSurvey()
  return await NodeDefRepository.fetchRootNodeDef(Survey.getSurveyInfo(survey).id, true)
}

const createNodeDef = async (parentNodeUuid, type, name) => {
  const survey = getContextSurvey()
  const surveyInfo = Survey.getSurveyInfo(survey)

  const nodeDefReq = NodeDef.newNodeDef(surveyInfo.id, parentNodeUuid, type, {name})
  return await NodeDefRepository.createNodeDef(surveyInfo.id, parentNodeUuid, nodeDefReq.uuid, type, nodeDefReq.props)
}

const createNodeDefsTest = async () => {
  const survey = getContextSurvey()
  const surveyInfo = Survey.getSurveyInfo(survey)

  const rootDef = await fetchRootNodeDef()

  const type = NodeDef.nodeDefType.text
  const nodeDefReq = NodeDef.newNodeDef(surveyInfo.id, rootDef.uuid, type, {name: 'node_def_' + type})
  const nodeDefDb = await NodeDefRepository.createNodeDef(surveyInfo.id, rootDef.uuid, nodeDefReq.uuid, type, nodeDefReq.props)

  expect(nodeDefDb.id).to.not.be.undefined
  expect(nodeDefDb.type).to.equal(type)
  expect(nodeDefDb.parentUuid).to.equal(nodeDefReq.parentUuid)
  expect(nodeDefDb.uuid).to.equal(nodeDefReq.uuid)
  expect(nodeDefDb.props).to.eql(nodeDefReq.props)
}

const updateNodeDefTest = async () => {
  const survey = getContextSurvey()
  const surveyInfo = Survey.getSurveyInfo(survey)

  const rootDef = await fetchRootNodeDef()

  const nodeDef1 = await createNodeDef(rootDef.uuid, NodeDef.nodeDefType.text, 'node_def_1')
  const nodeDef2 = await createNodeDef(rootDef.uuid, NodeDef.nodeDefType.boolean, 'node_def_2')

  const newName = 'node_def_1_new'
  const updatedNodeDef = await NodeDefRepository.updateNodeDefProps(surveyInfo.id, nodeDef1.uuid, [{key: 'name', value: newName, advanced: false}])

  expect(NodeDef.getNodeDefName(updatedNodeDef)).to.equal(newName)

  const nodeDefs = await NodeDefRepository.fetchNodeDefsBySurveyId(surveyInfo.id, true)

  //only one node def with that name
  expect(R.filter(n => NodeDef.getNodeDefName(n) === newName, nodeDefs).length).to.equal(1)

  //do not modify existing nodes
  const reloadedNodeDef2 = R.find(n => n.id === nodeDef2.id)(nodeDefs)
  expect(NodeDef.getNodeDefType(reloadedNodeDef2)).to.equal(NodeDef.getNodeDefType(nodeDef2))
  expect(NodeDef.getNodeDefName(reloadedNodeDef2)).to.equal(NodeDef.getNodeDefName(nodeDef2))
}

const updateNodeDefAdvancedPropsTest = async() => {
  const survey = await fetchFullContextSurvey()
  const rootDef = Survey.getRootNodeDef(survey)
  const nodeDef = Survey.getNodeDefChildByName(rootDef, 'node_def_text')(survey)

  console.log(nodeDef)

  const defaultValue1 = R.pipe(
    NodeDefExpression.createExpressionPlaceholder(),
    NodeDefExpression.assocExpression('1'),
    NodeDefExpression.assocApplyIf('false')
  )({})

  const defaultValue2 = R.pipe(
    NodeDefExpression.createExpressionPlaceholder(),
    NodeDefExpression.assocExpression('2')
  )({})

  const defaultValues = [defaultValue1, defaultValue2]

  const updatedNodeDef = await NodeDefRepository.updateNodeDefProps(Survey.getId(survey), NodeDef.getUuid(nodeDef),
    [{key: NodeDef.propKeys.defaultValues, value: defaultValues, advanced: true}])

  const nodeDefs = await NodeDefRepository.fetchNodeDefsBySurveyId(surveyInfo.id, true, true)
  const reloadedNodeDef = R.find(R.propEq('uuid', NodeDef.getUuid(updatedNodeDef)))(nodeDefs)

  expect(NodeDef.getDefaultValues(reloadedNodeDef)).to.equal(defaultValues)
}

module.exports = {
  createNodeDefsTest,
  updateNodeDefTest,
  updateNodeDefAdvancedPropsTest,
}