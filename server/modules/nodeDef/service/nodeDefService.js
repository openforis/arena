import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as SurveyValidator from '@core/survey/surveyValidator'
import * as Validation from '@core/validation/validation'

import { db } from '@server/db/db'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as NodeDefManager from '../manager/nodeDefManager'

export const { markNodeDefDeleted } = NodeDefManager

const fetchSurvey = async ({ surveyId, cycle }, t) => {
  const surveyDb = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
    {
      surveyId,
      cycle,
      draft: true,
      advanced: true,
      validate: false,
    },
    t
  )
  // build dependency graph if empty
  return Survey.hasDependencyGraph(surveyDb) ? surveyDb : Survey.buildAndAssocDependencyGraph(surveyDb)
}

const afterNodeDefUpdate = async ({ survey, nodeDef, nodeDefsDependent = [], nodeDefsUpdated }, t) => {
  const surveyId = Survey.getId(survey)
  let surveyUpdated = Survey.assocNodeDefs({
    nodeDefs: { ...Survey.getNodeDefs(survey), ...nodeDefsUpdated },
  })(survey)

  // add dependent node defs to dependency graph
  surveyUpdated = Survey.addNodeDefDependencies(nodeDef)(surveyUpdated)
  await SurveyManager.updateSurveyDependencyGraphs(surveyId, Survey.getDependencyGraph(surveyUpdated), t)

  const nodeDefsToValidate = [
    ...(NodeDef.isRoot(nodeDef) ? [] : [Survey.getNodeDefParent(nodeDef)(surveyUpdated)]), // always re-validate parent entity (keys may have been changed)
    ...Object.values(nodeDefsUpdated),
    ...nodeDefsDependent.map((uuid) => Survey.getNodeDefByUuid(uuid)(surveyUpdated)),
  ]

  const nodeDefsValidationArray = await Promise.all(
    nodeDefsToValidate.map((nodeDefToValidate) => SurveyValidator.validateNodeDef(surveyUpdated, nodeDefToValidate))
  )
  const valid = nodeDefsValidationArray.every(Validation.isValid)
  const nodeDefsValidation = Validation.newInstance(
    valid,
    nodeDefsToValidate.reduce(
      (nodeDefsValidationsAcc, nodeDefToValidate, index) => ({
        ...nodeDefsValidationsAcc,
        [nodeDefToValidate.uuid]: nodeDefsValidationArray[index],
      }),
      {}
    )
  )

  return {
    nodeDefsUpdated,
    nodeDefsValidation,
  }
}

export const insertNodeDef = async (
  { user, surveyId, cycle = Survey.cycleOneKey, nodeDef, chainNodeDef = null },
  client = db
) =>
  client.tx(async (t) => {
    const survey = await fetchSurvey({ surveyId, cycle }, t)

    const nodeDefsUpdated = await NodeDefManager.insertNodeDef(
      {
        user,
        surveyId,
        cycle,
        nodeDef,
        chainNodeDef,
      },
      t
    )
    const surveyUpdated = Survey.assocNodeDef({ nodeDef })(survey)

    return afterNodeDefUpdate({ survey: surveyUpdated, nodeDef, nodeDefsUpdated }, t)
  })

export const updateNodeDefProps = async (
  user,
  surveyId,
  cycle,
  nodeDefUuid,
  parentUuid,
  props,
  propsAdvanced = {},
  system = false,
  client = db
) =>
  client.tx(async (t) => {
    const survey = await fetchSurvey({ surveyId, cycle }, t)
    const nodeDefsDependent = Survey.getNodeDefDependencies(nodeDefUuid)(survey)

    // remove dependent node defs from dependency graph (add them back later)
    const surveyUpdated = Survey.removeNodeDefDependencies(nodeDefUuid)(survey)

    const nodeDefsUpdated = await NodeDefManager.updateNodeDefProps(
      user,
      surveyId,
      nodeDefUuid,
      parentUuid,
      props,
      propsAdvanced,
      system,
      t
    )
    const nodeDef = nodeDefsUpdated[nodeDefUuid]

    return afterNodeDefUpdate({ survey: surveyUpdated, nodeDef, nodeDefsDependent, nodeDefsUpdated }, t)
  })
