import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as NodeDefRepository from '@server/modules/nodeDef/repository/nodeDefRepository'
import { getContextSurvey } from '../../config/context'

const fetchRootNodeDef = async () => {
  const survey = getContextSurvey()
  return NodeDefRepository.fetchRootNodeDef(Survey.getId(survey), true)
}

const createNodeDef = (nodeDefParent, type, name, extraProps = {}) =>
  NodeDef.newNodeDef(nodeDefParent, type, [Survey.cycleOneKey], {
    [NodeDef.propKeys.name]: name,
    ...extraProps,
  })

const createAndStoreNodeDef = async (nodeDefParent, type, name, extraProps = {}) => {
  const survey = getContextSurvey()
  const nodeDef = createNodeDef(nodeDefParent, type, name, extraProps)
  return NodeDefRepository.insertNodeDef(Survey.getId(survey), nodeDef)
}

export const createNodeDefsTest = async () => {
  const survey = getContextSurvey()
  const surveyId = Survey.getId(survey)

  const rootDef = await fetchRootNodeDef()

  for (const nodeType of Object.keys(NodeDef.nodeDefType)) {
    const nodeDefReq = createNodeDef(rootDef, nodeType, `node_def_${nodeType}`)
    const nodeDefDb = await NodeDefRepository.insertNodeDef(surveyId, nodeDefReq)

    expect(nodeDefDb.id).toBeDefined()
    expect(nodeDefDb.type).toBe(nodeType)
    expect(nodeDefDb.parentUuid).toBe(NodeDef.getParentUuid(nodeDefReq))
    expect(nodeDefDb.uuid).toBe(NodeDef.getUuid(nodeDefReq))
    expect(nodeDefDb.props).toEqual(nodeDefReq.props)
  }
}

// Builds a small entity hierarchy used by the node def expressions validation tests, to exercise
// sibling/ancestor node reachability rules (as opposed to the flat, root-level node defs created by
// createNodeDefsTest, which recordUpdateManagerTest.js relies on staying direct children of root).
export const createExpressionsFixtureTest = async () => {
  const survey = getContextSurvey()
  const surveyId = Survey.getId(survey)

  const rootDef = await fetchRootNodeDef()

  const entity1 = await createAndStoreNodeDef(rootDef, NodeDef.nodeDefType.entity, 'entity1')
  await createAndStoreNodeDef(entity1, NodeDef.nodeDefType.text, 'entity1_text')
  await createAndStoreNodeDef(entity1, NodeDef.nodeDefType.text, 'sibling1')

  // Ancestor of entity1's children (root is entity1's parent).
  await createAndStoreNodeDef(rootDef, NodeDef.nodeDefType.text, 'ancestor1')

  // Exists in the survey, but inside a sibling *multiple* entity: unlike single entities (whose
  // attributes are globally reachable, since only one instance ever exists), a multiple entity's
  // descendants require explicit iteration context, so they're unreachable from entity1's subtree.
  const entity2 = await createAndStoreNodeDef(rootDef, NodeDef.nodeDefType.entity, 'entity2', {
    [NodeDef.propKeys.multiple]: true,
  })
  await createAndStoreNodeDef(entity2, NodeDef.nodeDefType.text, 'unreachable_node')
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
