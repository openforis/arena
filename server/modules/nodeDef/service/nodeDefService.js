import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as SurveyValidator from '@core/survey/surveyValidator'
import * as Validation from '@core/validation/validation'
import * as ObjectUtils from '@core/objectUtils'
import * as PromiseUtils from '@core/promiseUtils'

import { db } from '@server/db/db'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as NodeDefManager from '../manager/nodeDefManager'

const fetchSurvey = async ({ surveyId, cycle }, client = db) => {
  const surveyDb = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
    {
      surveyId,
      cycle,
      draft: true,
      advanced: true,
      validate: false,
    },
    client
  )
  // build dependency graph if empty
  return Survey.hasDependencyGraph(surveyDb) ? surveyDb : Survey.buildAndAssocDependencyGraph(surveyDb)
}

const _validateNodeDefs = async ({ survey, nodeDef, updatedNodeDefs, nodeDefsDependentByUuid }) => {
  const nodeDefsToValidateByUuid = {}

  // always re-validate parent entity (keys may have been changed)
  const nodeDefParent = !nodeDef || NodeDef.isRoot(nodeDef) ? null : Survey.getNodeDefParent(nodeDef)(survey)
  if (nodeDefParent) {
    nodeDefsToValidateByUuid[NodeDef.getUuid(nodeDefParent)] = nodeDefParent
  }
  Object.assign(nodeDefsToValidateByUuid, updatedNodeDefs, nodeDefsDependentByUuid)

  const nodeDefsToValidate = Object.values(nodeDefsToValidateByUuid)

  // perform node defs validation
  const nodeDefsValidationArray = await Promise.all(
    nodeDefsToValidate.map((nodeDefToValidate) => SurveyValidator.validateNodeDef(survey, nodeDefToValidate))
  )
  const nodeDefsValidationsByUuid = nodeDefsToValidate.reduce((nodeDefsValidationsAcc, nodeDefToValidate, index) => {
    nodeDefsValidationsAcc[NodeDef.getUuid(nodeDefToValidate)] = nodeDefsValidationArray[index]
    return nodeDefsValidationsAcc
  }, {})
  const valid = nodeDefsValidationArray.every(Validation.isValid)

  return Validation.newInstance(valid, nodeDefsValidationsByUuid)
}

const afterNodeDefUpdate = async (
  { survey, nodeDef = null, nodeDefsDependentsUuids = [], nodeDefsUpdated = {} },
  client = db
) => {
  const allUpdatedNodeDefs = { ...(nodeDef ? { [nodeDef.uuid]: nodeDef } : nodeDefsUpdated) }
  const updatedNodeDefsNotDeleted = ObjectUtils.toUuidIndexedObj(
    Object.values(allUpdatedNodeDefs).filter((def) => !NodeDef.isDeleted(def))
  )

  // merge node defs with existing ones
  let surveyUpdated = Survey.mergeNodeDefs(allUpdatedNodeDefs)(survey)

  // add dependent node defs to dependency graph
  // nodeDefsDependent can contain nodeDefs that have been updated and are in nodeDefsUpdated too: replace them with the updated ones
  const nodeDefDependents = Survey.getNodeDefsByUuids(nodeDefsDependentsUuids)(surveyUpdated)
  const nodeDefsDependentByUuid = ObjectUtils.toUuidIndexedObj(nodeDefDependents)

  surveyUpdated = Survey.addNodeDefsDependencies({
    ...updatedNodeDefsNotDeleted,
    ...nodeDefsDependentByUuid,
  })(surveyUpdated)

  await SurveyManager.updateSurveyDependencyGraphs(
    Survey.getId(surveyUpdated),
    Survey.getDependencyGraph(surveyUpdated),
    client
  )

  const nodeDefsValidation = await _validateNodeDefs({
    survey: surveyUpdated,
    nodeDef,
    updatedNodeDefs: allUpdatedNodeDefs,
    nodeDefsDependentByUuid,
  })

  return {
    nodeDefsUpdated,
    nodeDefsValidation,
  }
}

export const fetchNodeDef = async ({ surveyId, draft, advanced, nodeDefUuid }, client = db) =>
  NodeDefManager.fetchNodeDefByUuid(surveyId, nodeDefUuid, draft, advanced, client)

export const insertNodeDef = async ({ user, surveyId, cycle = Survey.cycleOneKey, nodeDef }, client = db) =>
  client.tx(async (t) => {
    const survey = await fetchSurvey({ surveyId, cycle }, t)

    const nodeDefsUpdated = await NodeDefManager.insertNodeDef(
      {
        user,
        survey,
        cycle,
        nodeDef,
      },
      t
    )
    const surveyUpdated = Survey.assocNodeDef({ nodeDef })(survey)

    return afterNodeDefUpdate({ survey: surveyUpdated, nodeDef, nodeDefsUpdated }, t)
  })

export const insertNodeDefs = async ({ user, surveyId, cycle = Survey.cycleOneKey, nodeDefs }, client = db) =>
  client.tx(async (t) => {
    const survey = await fetchSurvey({ surveyId, cycle }, t)

    await NodeDefManager.insertNodeDefsBatch(
      {
        surveyId,
        nodeDefs,
      },
      t
    )

    const surveyUpdated = Survey.assocNodeDefs({ nodeDefs })(survey)

    return afterNodeDefUpdate({ survey: surveyUpdated, nodeDefs: nodeDefs[0], nodeDefsUpdated: nodeDefs }, t)
  })

export const updateNodeDefProps = async (
  { user, surveyId, cycle, nodeDefUuid, parentUuid, props = {}, propsAdvanced = {}, system = false },
  client = db
) =>
  client.tx(async (t) => {
    const survey = await fetchSurvey({ surveyId, cycle }, t)

    const nodeDefsDependentsUuids = Survey.getNodeDefDependentsUuids(nodeDefUuid)(survey)

    // remove dependent node defs from dependency graph (add them back later)
    const surveyUpdated = Survey.removeNodeDefDependencies(nodeDefUuid)(survey)

    const nodeDefsUpdated = await NodeDefManager.updateNodeDefProps(
      {
        user,
        survey,
        nodeDefUuid,
        parentUuid,
        props,
        propsAdvanced,
        system,
      },
      t
    )
    const nodeDef = nodeDefsUpdated[nodeDefUuid]

    return afterNodeDefUpdate({ survey: surveyUpdated, nodeDef, nodeDefsDependentsUuids, nodeDefsUpdated }, t)
  })

export const updateNodeDefsProps = async ({ surveyId, nodeDefs }, client = db) =>
  NodeDefManager.updateNodeDefPropsInBatch({ surveyId, nodeDefs }, client)

export const moveNodeDef = async ({ user, surveyId, nodeDefUuid, targetParentNodeDefUuid }, client = db) =>
  client.tx(async (t) => {
    const survey = await fetchSurvey({ surveyId }, t)

    const nodeDefsDependentsUuids = Survey.getNodeDefDependentsUuids(nodeDefUuid)(survey)

    const nodeDefsUpdated = await NodeDefManager.moveNodeDef({ user, survey, nodeDefUuid, targetParentNodeDefUuid }, t)

    // remove dependent node defs from dependency graph (add them back later)
    const surveyUpdated = Survey.removeNodeDefDependencies(nodeDefUuid)(survey)

    return afterNodeDefUpdate({ survey: surveyUpdated, nodeDefsDependentsUuids, nodeDefsUpdated }, t)
  })

export const convertNodeDef = async ({ user, surveyId, nodeDefUuid, toType }, client = db) =>
  client.tx(async (t) => {
    const survey = await fetchSurvey({ surveyId }, t)

    const nodeDefsDependentsUuids = Survey.getNodeDefDependentsUuids(nodeDefUuid)(survey)

    const nodeDefsUpdated = await NodeDefManager.convertNodeDef({ user, survey, nodeDefUuid, toType }, t)

    return afterNodeDefUpdate({ survey, nodeDefsDependentsUuids, nodeDefsUpdated }, t)
  })

export const fetchNodeDefsUpdatedAndValidated = async ({ user, surveyId, cycle, nodeDefsUpdated }, client = db) => {
  const survey = await fetchSurvey({ surveyId, cycle }, client)

  return afterNodeDefUpdate({ survey, nodeDefsUpdated }, client)
}

export const markNodeDefDeleted = async ({ user, surveyId, cycle, nodeDefUuid }, client = db) =>
  client.tx(async (t) => {
    const survey = await fetchSurvey({ surveyId, cycle }, t)

    const nodeDefsDependentsUuids = Survey.getNodeDefDependentsUuids(nodeDefUuid)(survey)

    const nodeDefsUpdated = await NodeDefManager.markNodeDefDeleted({ user, survey, cycle, nodeDefUuid }, t)

    // remove dependent node defs from dependency graph (add them back later)
    const surveyUpdated = Survey.removeNodeDefDependencies(nodeDefUuid)(survey)

    const nodeDef = nodeDefsUpdated[nodeDefUuid]

    return afterNodeDefUpdate({ survey: surveyUpdated, nodeDef, nodeDefsDependentsUuids, nodeDefsUpdated }, t)
  })

export const markNodeDefsDeleted = async ({ user, surveyId, cycle, nodeDefUuids }, client = db) => {
  let response = { nodeDefsUpdated: {}, nodeDefsValidation: {} }

  await PromiseUtils.each(nodeDefUuids, async (nodeDefUuid) => {
    const _response = await markNodeDefDeleted({ user, surveyId, cycle, nodeDefUuid }, client)
    response = R.mergeDeepLeft(response, _response)
  })

  return response
}

export {
  // ======  READ - entities
  countVirtualEntities,
  fetchVirtualEntities,
} from '../repository/nodeDefRepository'
