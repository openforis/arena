const {getContextSurvey} = require('./../../testContext')
const {expect} = require('chai')
const R = require('ramda')

const Survey = require('../../../common/survey/survey')
const NodeDef = require('../../../common/survey/nodeDef')

const NodeDefRepository = require('../../../server/modules/nodeDef/persistence/nodeDefRepository')

const fetchRootNodeDef = async () => {
  const survey = getContextSurvey()
  return await NodeDefRepository.fetchRootNodeDef(Survey.getSurveyInfo(survey).id, true)
}

const createNodeDef = async (parentNodeUuid, type, name) => {
  const survey = getContextSurvey()
  const surveyInfo = Survey.getSurveyInfo(survey)

  const nodeDefReq = NodeDef.newNodeDef(surveyInfo.id, parentNodeUuid, type, {name})
  return await NodeDefRepository.createNodeDef(surveyInfo.id, parentNodeUuid, NodeDef.getUuid(nodeDefReq), type, nodeDefReq.props)
}

const createNodeDefsTest = async () => {
  const survey = getContextSurvey()
  const surveyId = Survey.getId(survey)

  const rootDef = await fetchRootNodeDef()
  const rootDefUuid = NodeDef.getUuid(rootDef)

  const type = NodeDef.nodeDefType.text
  const nodeDefReq = NodeDef.newNodeDef(surveyId, rootDefUuid, type, {name: 'node_def_' + type})
  const nodeDefDb = await NodeDefRepository.createNodeDef(surveyId, rootDefUuid, NodeDef.getUuid(nodeDefReq), type, nodeDefReq.props)

  expect(nodeDefDb.id).to.not.be.undefined
  expect(nodeDefDb.type).to.equal(type)
  expect(nodeDefDb.parentUuid).to.equal(NodeDef.getParentUuid(nodeDefReq))
  expect(nodeDefDb.uuid).to.equal(NodeDef.getUuid(nodeDefReq))
  expect(nodeDefDb.props).to.eql(nodeDefReq.props)
}

const updateNodeDefTest = async () => {
  const survey = getContextSurvey()
  const surveyId = Survey.getId(survey)

  const rootDef = await fetchRootNodeDef()
  const rootDefUuid = NodeDef.getUuid(rootDef)

  const nodeDef1 = await createNodeDef(rootDefUuid, NodeDef.nodeDefType.text, 'node_def_1')
  const nodeDef2 = await createNodeDef(rootDefUuid, NodeDef.nodeDefType.boolean, 'node_def_2')

  const newName = 'node_def_1_new'
  const updatedNodeDef = await NodeDefRepository.updateNodeDefProps(surveyId, NodeDef.getUuid(nodeDef1), {
    name: newName
  })

  expect(NodeDef.getName(updatedNodeDef)).to.equal(newName)

  const nodeDefs = await NodeDefRepository.fetchNodeDefsBySurveyId(surveyId, true)

  //only one node def with that name
  expect(R.filter(n => NodeDef.getName(n) === newName, nodeDefs).length).to.equal(1)

  //do not modify existing nodes
  const reloadedNodeDef2 = R.find(n => NodeDef.getUuid(n) === NodeDef.getUuid(nodeDef2))(nodeDefs)
  expect(NodeDef.getType(reloadedNodeDef2)).to.equal(NodeDef.getType(nodeDef2))
  expect(NodeDef.getName(reloadedNodeDef2)).to.equal(NodeDef.getName(nodeDef2))
}

module.exports = {
  createNodeDefsTest,
  updateNodeDefTest,
}