import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as PromiseUtils from '@core/promiseUtils'

import * as NodeDefRepository from '@server/modules/nodeDef/repository/nodeDefRepository'
import { getContextSurvey } from '../../config/context'

const fetchRootNodeDef = async () => {
  const survey = getContextSurvey()
  return NodeDefRepository.fetchRootNodeDef(Survey.getId(survey), true)
}

const createNodeDef = (nodeDefParent, type, name) =>
  NodeDef.newNodeDef(nodeDefParent, type, [Survey.cycleOneKey], {
    [NodeDef.propKeys.name]: name,
  })

const createAndStoreNodeDef = async (nodeDefParent, type, name) => {
  const survey = getContextSurvey()
  const nodeDef = createNodeDef(nodeDefParent, type, name)
  return NodeDefRepository.insertNodeDef(Survey.getId(survey), nodeDef)
}

export const createNodeDefsTest = async () => {
  const survey = getContextSurvey()
  const surveyId = Survey.getId(survey)

  const rootDef = await fetchRootNodeDef()

  await PromiseUtils.each(Object.keys(NodeDef.nodeDefType), async (nodeType) => {
    const nodeDefReq = createNodeDef(rootDef, nodeType, `node_def_${nodeType}`)
    const nodeDefDb = await NodeDefRepository.insertNodeDef(surveyId, nodeDefReq)

    /* eslint-disable no-unused-expressions */
    expect(nodeDefDb.id).toBeDefined()
    expect(nodeDefDb.type).toBe(nodeType)
    expect(nodeDefDb.parentUuid).toBe(NodeDef.getParentUuid(nodeDefReq))
    expect(nodeDefDb.uuid).toBe(NodeDef.getUuid(nodeDefReq))
    expect(nodeDefDb.props).toEqual(nodeDefReq.props)
  })
}

export const updateNodeDefTest = async () => {
  const survey = getContextSurvey()
  const surveyId = Survey.getId(survey)

  const rootDef = await fetchRootNodeDef()

  const nodeDef1 = await createAndStoreNodeDef(rootDef, NodeDef.nodeDefType.text, 'node_def_1')
  const nodeDef2 = await createAndStoreNodeDef(rootDef, NodeDef.nodeDefType.boolean, 'node_def_2')

  const newName = 'node_def_1_new'
  const nodeDef1Uuid = NodeDef.getUuid(nodeDef1)
  const updatedNodeDef = await NodeDefRepository.updateNodeDefProps({
    surveyId,
    nodeDefUuid: nodeDef1Uuid,
    parentUuid: NodeDef.getParentUuid(nodeDef1),
    props: { name: newName },
  })
  expect(NodeDef.getName(updatedNodeDef)).toBe(newName)

  const nodeDefs = await NodeDefRepository.fetchNodeDefsBySurveyId({ surveyId, cycle: Survey.cycleOneKey, draft: true })

  // Only one node def with that name
  expect(R.filter((n) => NodeDef.getName(n) === newName, nodeDefs).length).toBe(1)

  // Do not modify existing nodes
  const reloadedNodeDef2 = R.find((n) => NodeDef.getUuid(n) === NodeDef.getUuid(nodeDef2))(nodeDefs)
  expect(NodeDef.getType(reloadedNodeDef2)).toBe(NodeDef.getType(nodeDef2))
  expect(NodeDef.getName(reloadedNodeDef2)).toBe(NodeDef.getName(nodeDef2))
}
