import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as SurveyValidator from '@core/survey/surveyValidator'
import * as Validation from '@core/validation/validation'

import { db } from '@server/db/db'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as NodeDefManager from '../manager/nodeDefManager'

export const { insertNodeDef, markNodeDefDeleted } = NodeDefManager.insertNodeDef

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
    const survey = Survey.hasDependencyGraph(surveyDb) ? surveyDb : Survey.buildAndAssocDependencyGraph(surveyDb)
    const nodeDefsDependent = Survey.getNodeDefDependencies(nodeDefUuid)(survey)

    // remove dependent node defs from dependency graph (add them back later)
    let surveyUpdated = Survey.removeNodeDefDependencies(nodeDefUuid)(survey)

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

    surveyUpdated = Survey.assocNodeDefs({
      nodeDefs: { ...Survey.getNodeDefs(surveyUpdated), ...nodeDefsUpdated },
    })(surveyUpdated)

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
  })
