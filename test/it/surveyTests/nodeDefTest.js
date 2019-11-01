const { getContextSurvey } = require('../../testContext')
const { expect } = require('chai')
const R = require('ramda')

const Survey = require('@core/survey/survey')
const NodeDef = require('@core/survey/nodeDef')

const NodeDefRepository = require('@server/modules/nodeDef/repository/nodeDefRepository')

const fetchRootNodeDef = async () => {
  const survey = getContextSurvey()
  return await NodeDefRepository.fetchRootNodeDef(Survey.getId(survey), true)
}

const createNodeDef = (parentNodeUuid, type, name) =>
  NodeDef.newNodeDef(parentNodeUuid, type, Survey.cycleOneKey, {
    [NodeDef.propKeys.name]: name,
  })

const createAndStoreNodeDef = async (parentNodeUuid, type, name) => {
  const survey = getContextSurvey()
  const nodeDef = createNodeDef(parentNodeUuid, type, name)
  return await NodeDefRepository.insertNodeDef(Survey.getId(survey), nodeDef)
}

const createNodeDefsTest = async () => {
  const survey = getContextSurvey()
  const surveyId = Survey.getId(survey)

  const rootDef = await fetchRootNodeDef()
  const rootDefUuid = NodeDef.getUuid(rootDef)

  for (const nodeType in NodeDef.nodeDefType) {
    const nodeDefReq = createNodeDef(rootDefUuid, nodeType, `node_def_${nodeType}`)
    const nodeDefDb = await NodeDefRepository.insertNodeDef(surveyId, nodeDefReq)

    expect(nodeDefDb.id).to.not.be.undefined
    expect(nodeDefDb.type).to.equal(nodeType)
    expect(nodeDefDb.parentUuid).to.equal(NodeDef.getParentUuid(nodeDefReq))
    expect(nodeDefDb.uuid).to.equal(NodeDef.getUuid(nodeDefReq))
    expect(nodeDefDb.props).to.eql(nodeDefReq.props)
  }
}

const updateNodeDefTest = async () => {
  const survey = getContextSurvey()
  const surveyId = Survey.getId(survey)

  const rootDef = await fetchRootNodeDef()
  const rootDefUuid = NodeDef.getUuid(rootDef)

  const nodeDef1 = await createAndStoreNodeDef(rootDefUuid, NodeDef.nodeDefType.text, 'node_def_1')
  const nodeDef2 = await createAndStoreNodeDef(rootDefUuid, NodeDef.nodeDefType.boolean, 'node_def_2')

  const newName = 'node_def_1_new'
  const nodeDef1Uuid = NodeDef.getUuid(nodeDef1)
  const updatedNodeDef = await NodeDefRepository.updateNodeDefProps(surveyId, nodeDef1Uuid, { name: newName })
  expect(NodeDef.getName(updatedNodeDef)).to.equal(newName)

  const nodeDefs = await NodeDefRepository.fetchNodeDefsBySurveyId(surveyId, Survey.cycleOneKey, true)

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