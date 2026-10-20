import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayoutUpdater from '@core/survey/nodeDefLayoutUpdater'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Category from '@core/survey/category'
import { buildApplyPlan, compareSurveys } from '@core/survey/surveyCompare'

import * as SB from './surveyBuilder'

// helpers for the survey comparison tests

export const cycle = Survey.cycleOneKey

export const buildCategory = () =>
  SB.category('tree_species')
    .levels('species')
    .items(SB.categoryItem('1').label('Oak'), SB.categoryItem('2').label('Pine'))

export const buildSurvey = async ({ categoryBuilder = buildCategory() } = {}) => {
  const survey = await SB.survey(
    null,
    SB.entity(
      'cluster',
      SB.attribute('cluster_id', NodeDef.nodeDefType.integer).key(),
      SB.entity(
        'tree',
        SB.attribute('tree_id', NodeDef.nodeDefType.integer).key(),
        SB.attribute('species', NodeDef.nodeDefType.code).category('tree_species'),
        SB.attribute('dbh', NodeDef.nodeDefType.decimal)
      ).multiple()
    )
  )
    .categories(categoryBuilder)
    .build()
  return { survey, items: categoryBuilder.build().items }
}

export const clone = (obj: any) => structuredClone(obj)

export const itemsByCategoryUuid = (survey: any, items: any[]) => ({
  [Category.getUuid(Survey.getCategoryByName('tree_species')(survey))]: items,
})

export const compare = ({ source, target, sourceItems, targetItems }) =>
  compareSurveys({
    sourceSurvey: source,
    targetSurvey: target,
    sourceItemsByCategoryUuid: itemsByCategoryUuid(source, sourceItems),
    targetItemsByCategoryUuid: itemsByCategoryUuid(target, targetItems),
  })

export const addAttribute = async ({ survey, parentName, name, type = NodeDef.nodeDefType.text, props = {} }) => {
  const parent = Survey.getNodeDefByName(parentName)(survey)
  const nodeDef = NodeDef.newNodeDef(parent, type, [cycle], { name, ...props })
  delete nodeDef.temporary
  let surveyUpdated = Survey.assocNodeDef({ nodeDef })(survey)
  const parentUpdated = NodeDefLayoutUpdater.updateParentLayout({
    survey: surveyUpdated,
    nodeDef,
    cyclesAdded: [cycle],
  })
  surveyUpdated = Survey.mergeNodeDefs({ [NodeDef.getUuid(parent)]: parentUpdated })(surveyUpdated)
  return { survey: await Survey.buildAndAssocDependencyGraph(surveyUpdated), nodeDef }
}

export const updateNodeDef = ({ survey, name, updateFn }) => {
  const nodeDef = Survey.getNodeDefByName(name)(survey)
  return Survey.mergeNodeDefs({ [NodeDef.getUuid(nodeDef)]: updateFn(nodeDef) })(survey)
}

export const setValidationExpression = (expression: string) => (nodeDef: any) =>
  NodeDef.mergePropsAdvanced({
    [NodeDef.keysPropsAdvanced.validations]: NodeDefValidations.assocExpressions([
      NodeDefExpression.createExpression({ expression }),
    ])(NodeDef.getValidations(nodeDef)),
  })(nodeDef)

export const markAllPublished = (survey: any) => {
  const nodeDefs = Object.fromEntries(
    Survey.getNodeDefsArray(survey).map((nodeDef) => [NodeDef.getUuid(nodeDef), { ...nodeDef, published: true }])
  )
  return Survey.mergeNodeDefs(nodeDefs)(survey)
}

export const findDiff = (result: any, name: string) => result.nodeDefs.find((diff) => diff.name === name)

export const plan = ({ source, target, sourceItems, targetItems, result, selectedIds, ...others }: any) =>
  buildApplyPlan({
    sourceSurvey: source,
    targetSurvey: target,
    sourceItemsByCategoryUuid: itemsByCategoryUuid(source, sourceItems),
    targetItemsByCategoryUuid: itemsByCategoryUuid(target, targetItems),
    result,
    selectedIds,
    ...others,
  })
