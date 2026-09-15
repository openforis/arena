import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as RecordManager from '@server/modules/record/manager/recordManager'

import * as SurveyManager from '../../manager/surveyManager'
import { findNodeDefUuidsAffectedByCategoryOrTaxonomyExtraPropChanges } from './nodeDefExtraPropDependencyUtils'

export type RecordValuesUpdateWarning = {
  attributeNames: string[]
  categoryOrTaxonomyExtraPropAttributeNames: string[]
}

// Dependency types whose source-side re-evaluation can, in cascade, change a dependent node def's
// stored value: "defaultValues" (dependent's default value formula reads the source) and "applicable"
// (dependent becoming applicable triggers its default value to be evaluated; becoming not-applicable
// clears its value - see recordNodeDependentsDefaultValuesUpdater.js/recordNodesUpdater.js on the
// record-update side, which re-evaluate default values on both triggers).
const _valueUpdateCascadeDependencyTypes = [Survey.dependencyTypes.defaultValues, Survey.dependencyTypes.applicable]

// Collects the uuids of node defs that transitively depend, through a "default values" or "applicable"
// expression, on any of the given node def uuids - e.g. if A's value is changing and B's default value
// expression (or applicable expression) reads A, and C's reads B, both B and C are at risk of having
// their stored value recalculated (evaluated or cleared) in cascade when A's value changes on publish.
// dependencyGraph is single-hop only (see Survey.getNodeDefDependencies), so this walks it transitively,
// one hop at a time and across both dependency types, to reach the full transitive closure.
const _findTransitiveValueUpdateDependentUuids = ({
  survey,
  nodeDefUuids,
}: {
  survey: any
  nodeDefUuids: string[]
}): Set<string> => {
  const visitedUuids = new Set(nodeDefUuids)
  const transitiveDependentUuids = new Set<string>()
  const stack = [...nodeDefUuids]

  while (stack.length > 0) {
    const nodeDefUuidCurrent = stack.pop()
    for (const dependencyType of _valueUpdateCascadeDependencyTypes) {
      const dependents = Survey.getNodeDefDependencies(nodeDefUuidCurrent, dependencyType)(survey)
      for (const nodeDefDependent of dependents) {
        const nodeDefDependentUuid = NodeDef.getUuid(nodeDefDependent)
        if (!visitedUuids.has(nodeDefDependentUuid)) {
          visitedUuids.add(nodeDefDependentUuid)
          transitiveDependentUuids.add(nodeDefDependentUuid)
          stack.push(nodeDefDependentUuid)
        }
      }
    }
  }
  return transitiveDependentUuids
}

// Maps a set of at-risk node def uuids (plus their transitive cascade, see
// _findTransitiveValueUpdateDependentUuids) to the names of the already-published, non-deleted node defs
// among them.
const _toAtRiskNodeDefNames = ({
  survey,
  nodeDefUuids,
  transitiveDependentUuids,
}: {
  survey: any
  nodeDefUuids: string[]
  transitiveDependentUuids: Set<string>
}): string[] =>
  [...new Set([...nodeDefUuids, ...transitiveDependentUuids])]
    .map((nodeDefUuid) => Survey.getNodeDefByUuid(nodeDefUuid)(survey))
    .filter((nodeDef) => nodeDef && NodeDef.isPublished(nodeDef) && !NodeDef.isDeleted(nodeDef))
    .map(NodeDef.getName)

// Names of already-published, non-deleted node defs at risk of having their stored record value
// silently recalculated on publish - i.e. the same node defs RecordCheckJob would recalculate. Split by
// root cause, so the publish warning can explain *why* each attribute is affected rather than lumping
// every name into one generic message:
// 1. attributeNames: a value-affecting advanced prop change on the node def itself (applicable/default
//    values/file name expression/enumerating items expression/items filter) - see
//    NodeDef.hasValueAffectingAdvancedPropsDraft. backup: true keeps propsAdvancedDraft separate from
//    propsAdvanced, which that check needs.
// 2. categoryOrTaxonomyExtraPropAttributeNames: a categoryItemProp/taxonProp reference to a
//    category/taxonomy extra prop (definition or item/taxon value) that changed in the draft, while the
//    node def itself wasn't touched - see findNodeDefUuidsAffectedByCategoryOrTaxonomyExtraPropChanges.
// Each group also includes published node defs that would be updated in cascade through a chain of
// "default values"/"applicable" expressions rooted in that group (see
// _findTransitiveValueUpdateDependentUuids) - reachability is additive across roots, so splitting the
// transitive walk per group rather than running it once on the union yields the same overall closure. A
// node def reachable from both groups (or directly at risk in both) is only reported under the
// attribute-changed group, since that cause is the more specific/actionable one.
// The node-def fetch itself stays a plain, cheap one regardless of survey size or record count; the
// category/taxonomy check adds a few small extra queries (see that function for the cost profile).
const _findNodeDefNamesWithRecordValuesUpdateRisk = async ({
  surveyId,
}: {
  surveyId: number
}): Promise<RecordValuesUpdateWarning> => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
    surveyId,
    draft: true,
    advanced: true,
    backup: true,
  })
  const nodeDefUuidsWithAdvancedPropsRisk = Survey.getNodeDefsArray(survey)
    .filter(
      (nodeDef: any) =>
        NodeDef.isPublished(nodeDef) &&
        !NodeDef.isDeleted(nodeDef) &&
        NodeDef.hasValueAffectingAdvancedPropsDraft(nodeDef)
    )
    .map(NodeDef.getUuid)

  // validationAffectedNodeDefUuids intentionally unused here: this warning is about record *value*
  // recalculation risk, not validation staleness (see recordCheckJob.js for that separate handling).
  const { valueAffectedNodeDefUuids } = await findNodeDefUuidsAffectedByCategoryOrTaxonomyExtraPropChanges({
    surveyId,
    survey,
  })

  const attributeNames = _toAtRiskNodeDefNames({
    survey,
    nodeDefUuids: nodeDefUuidsWithAdvancedPropsRisk,
    transitiveDependentUuids: _findTransitiveValueUpdateDependentUuids({
      survey,
      nodeDefUuids: nodeDefUuidsWithAdvancedPropsRisk,
    }),
  })
  const attributeNamesSet = new Set(attributeNames)

  const categoryOrTaxonomyExtraPropAttributeNames = _toAtRiskNodeDefNames({
    survey,
    nodeDefUuids: [...valueAffectedNodeDefUuids],
    transitiveDependentUuids: _findTransitiveValueUpdateDependentUuids({
      survey,
      nodeDefUuids: [...valueAffectedNodeDefUuids],
    }),
  }).filter((name) => !attributeNamesSet.has(name))

  return { attributeNames, categoryOrTaxonomyExtraPropAttributeNames }
}

/**
 * Checks, cheaply and without touching any record, whether publishing the survey could silently
 * recalculate values already stored in existing records. Meant to be called up front, before starting
 * the (potentially long) publish job, so the user sees this warning immediately rather than after
 * waiting for a full record check.
 * @param {object} params - Params.
 * @param {number} params.surveyId - Survey id.
 * @returns {Promise<RecordValuesUpdateWarning|null>} the at-risk attribute names, grouped by cause, if
 *   publishing is at risk of updating recorded values, `null` otherwise.
 */
export const checkPublishRecordValuesUpdateWarning = async ({
  surveyId,
}: {
  surveyId: number
}): Promise<RecordValuesUpdateWarning | null> => {
  const { attributeNames, categoryOrTaxonomyExtraPropAttributeNames } =
    await _findNodeDefNamesWithRecordValuesUpdateRisk({ surveyId })
  if (attributeNames.length === 0 && categoryOrTaxonomyExtraPropAttributeNames.length === 0) return null

  const recordsCount = await RecordManager.countAllRecordsBySurveyId({ surveyId })
  if (recordsCount === 0) return null

  return { attributeNames, categoryOrTaxonomyExtraPropAttributeNames }
}
