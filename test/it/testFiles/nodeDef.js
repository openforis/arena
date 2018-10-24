const {getContextSurvey} = require('./../../testContext')
const {assert, expect} = require('chai')
const R = require('ramda')

const nodeDefRepository = require('../../../server/nodeDef/nodeDefRepository')
const {nodeDefType, newNodeDef, getNodeDefName, getNodeDefType} = require('../../../common/survey/nodeDef')

const createRootDefIfNotExists = async () => {
  const survey = getContextSurvey()

  let rootDef = R.head(await nodeDefRepository.fetchNodeDefsByParentId(survey.id, null))
  if (rootDef) {
    return rootDef
  } else {
    return await createNodeDef(survey.id, null, nodeDefType.entity, 'root_def')
  }
}

const createNodeDef = async (surveyId, parentNodeId, type, name) => {
  const nodeDefReq = newNodeDef(surveyId, parentNodeId, type, {name})
  return await nodeDefRepository.createNodeDef(surveyId, parentNodeId, nodeDefReq.uuid, type, nodeDefReq.props)
}

const createNodeDefsTest = async () => {
  R.keys(nodeDefType).map(async type => {
    const survey = getContextSurvey()

    const rootDef = await createRootDefIfNotExists()

    const nodeDefReq = newNodeDef(survey.id, rootDef.id, type, {name: 'node_def_' + type})
    const nodeDefDb = await nodeDefRepository.createNodeDef(survey.id, rootDef.id, nodeDefReq.uuid, type, nodeDefReq.props)

    expect(nodeDefDb.id).to.not.be.undefined
    expect(nodeDefDb.type).to.eql(type)
    expect(nodeDefDb.surveyId).to.eql(survey.id)
    expect(nodeDefDb.parentId).to.eql(nodeDefReq.parentId)
    expect(nodeDefDb.uuid).to.eql(nodeDefReq.uuid)
    expect(nodeDefDb.props).to.eql(nodeDefReq.props)
  })
}

const updateNodeDefTest = async() => {
  const survey = getContextSurvey()

  const rootDef = await createRootDefIfNotExists()

  const nodeDef1 = await createNodeDef(survey.id, rootDef.id, nodeDefType.text, 'node_def_1')
  const nodeDef2 = await createNodeDef(survey.id, rootDef.id, nodeDefType.boolean, 'node_def_2')

  const newName = 'node_def_1_new'
  const updatedNodeDef = await nodeDefRepository.updateNodeDefProp(nodeDef1.id, {name: newName})

  expect(getNodeDefName(updatedNodeDef)).to.eql(newName)

  const nodeDefs = await nodeDefRepository.fetchNodeDefsBySurveyId(survey.id)

  //only one node def with that name
  expect(R.find(n => getNodeDefName(n) === newName, nodeDefs).length).to.be(1)

  //do not modify existing nodes
  const reloadedNodeDef2 = R.find(n => n.id === nodeDef2.id)
  expect(getNodeDefType(reloadedNodeDef2)).to.be(getNodeDefType(nodeDef2))
  expect(getNodeDefName(reloadedNodeDef2)).to.be(getNodeDefName(nodeDef2))
}


module.exports = {
  createNodeDefsTest,
  updateNodeDefTest,
}