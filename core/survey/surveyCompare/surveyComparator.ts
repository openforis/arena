import * as Survey from '@core/survey/survey'
import * as Taxonomy from '@core/survey/taxonomy'

import {
  SurveyCompareApplicabilityStatus,
  SurveyCompareMatchType,
  SurveyCompareParams,
  SurveyComparePropDiff,
  SurveyComparePropGroup,
  SurveyCompareReason,
  SurveyCompareResult,
  SurveyCompareStatus,
  SurveyCompareTaxonomyDiff,
} from './surveyCompareTypes'
import { buildNodeDefsIndex } from './surveyCompareNodeDefsIndex'
import { compareNodeDefs, matchNodeDefs } from './surveyCompareNodeDefs'
import { compareCategories, matchCategories } from './surveyCompareCategories'
import { evaluateApplicability } from './surveyCompareApplicability'
import { getDifferentKeys, normalizeValue } from './surveyCompareValues'

export const taxonomyChangeId = (uuid: string): string => `taxonomy:${uuid}`

const normalizeSurveyInfo = (survey: any) => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  return normalizeValue({
    languages: Survey.getLanguages(surveyInfo),
    labels: Survey.getLabels(surveyInfo),
    descriptions: Survey.getDescriptions(surveyInfo),
    cycles: Survey.getCycleKeys(surveyInfo),
    srs: Survey.getSRSCodes(surveyInfo),
  })
}

const compareSurveyInfo = ({ sourceSurvey, targetSurvey }): SurveyComparePropDiff[] => {
  const source = normalizeSurveyInfo(sourceSurvey) ?? {}
  const target = normalizeSurveyInfo(targetSurvey) ?? {}
  return getDifferentKeys({ source, target }).map((key) => ({
    key,
    group: SurveyComparePropGroup.props,
    source: source[key],
    target: target[key],
  }))
}

const normalizeTaxonomy = (taxonomy: any) =>
  normalizeValue({
    name: Taxonomy.getName(taxonomy),
    descriptions: Taxonomy.getDescriptions(taxonomy),
    vernacularLanguageCodes: Taxonomy.getVernacularLanguageCodes(taxonomy),
    extraPropsDefs: Taxonomy.getExtraPropsDefs(taxonomy),
  }) ?? {}

const findTaxonomyMatch = ({ source, targetTaxonomies, targetsMatched }) => {
  const byUuid = targetTaxonomies.find((taxonomy) => Taxonomy.getUuid(taxonomy) === Taxonomy.getUuid(source))
  if (byUuid) return { target: byUuid, matchedBy: SurveyCompareMatchType.uuid }
  const byName = targetTaxonomies.find(
    (taxonomy) =>
      !targetsMatched.has(Taxonomy.getUuid(taxonomy)) && Taxonomy.getName(taxonomy) === Taxonomy.getName(source)
  )
  return byName ? { target: byName, matchedBy: SurveyCompareMatchType.name } : {}
}

const notSupportedApplicability = {
  status: SurveyCompareApplicabilityStatus.notApplicable,
  reasons: [SurveyCompareReason.taxonomySyncNotSupported],
}

// taxonomies are compared by their props only (taxa are not compared yet)
const compareTaxonomies = ({ sourceSurvey, targetSurvey }) => {
  const targetTaxonomies = Survey.getTaxonomiesArray(targetSurvey)
  const targetsMatched = new Set<string>()
  const diffs: SurveyCompareTaxonomyDiff[] = []
  const taxonomyTargetUuidBySourceUuid: Record<string, string> = {}

  for (const source of Survey.getTaxonomiesArray(sourceSurvey)) {
    const sourceUuid = Taxonomy.getUuid(source)
    const { target, matchedBy } = findTaxonomyMatch({ source, targetTaxonomies, targetsMatched })
    if (target) {
      const targetUuid = Taxonomy.getUuid(target)
      targetsMatched.add(targetUuid)
      taxonomyTargetUuidBySourceUuid[sourceUuid] = targetUuid
      const sourceNormalized = normalizeTaxonomy(source)
      const targetNormalized = normalizeTaxonomy(target)
      const propDiffs = getDifferentKeys({ source: sourceNormalized, target: targetNormalized }).map((key) => ({
        key,
        group: SurveyComparePropGroup.props,
        source: sourceNormalized[key],
        target: targetNormalized[key],
      }))
      const changed = propDiffs.length > 0
      diffs.push({
        id: taxonomyChangeId(sourceUuid),
        sourceUuid,
        targetUuid,
        matchedBy,
        name: Taxonomy.getName(source),
        status: changed ? SurveyCompareStatus.changed : SurveyCompareStatus.identical,
        propDiffs,
        applicability: changed ? notSupportedApplicability : undefined,
        dependsOn: [],
        linkedTo: [],
      })
    } else {
      diffs.push({
        id: taxonomyChangeId(sourceUuid),
        sourceUuid,
        name: Taxonomy.getName(source),
        status: SurveyCompareStatus.added,
        propDiffs: [],
        applicability: notSupportedApplicability,
        dependsOn: [],
        linkedTo: [],
      })
    }
  }
  for (const target of targetTaxonomies) {
    const targetUuid = Taxonomy.getUuid(target)
    if (!targetsMatched.has(targetUuid)) {
      diffs.push({
        id: taxonomyChangeId(targetUuid),
        targetUuid,
        name: Taxonomy.getName(target),
        status: SurveyCompareStatus.removed,
        propDiffs: [],
        applicability: notSupportedApplicability,
        dependsOn: [],
        linkedTo: [],
      })
    }
  }
  diffs.sort((diffA, diffB) => diffA.name.localeCompare(diffB.name))
  return { diffs, taxonomyTargetUuidBySourceUuid }
}

const countByStatus = (diffs: { status: string }[]) => ({
  added: diffs.filter((diff) => diff.status === SurveyCompareStatus.added).length,
  changed: diffs.filter((diff) => diff.status === SurveyCompareStatus.changed).length,
  removed: diffs.filter((diff) => diff.status === SurveyCompareStatus.removed).length,
})

/**
 * Compares a source survey (e.g. uploaded from another environment) with a target survey (the one to update).
 * Category items must be passed separately (they are not part of the survey object).
 * @param {SurveyCompareParams} params - The parameters.
 * @returns {SurveyCompareResult} - The comparison result.
 */
export const compareSurveys = ({
  sourceSurvey,
  targetSurvey,
  sourceItemsByCategoryUuid,
  targetItemsByCategoryUuid,
}: SurveyCompareParams): SurveyCompareResult => {
  const sourceIndex = buildNodeDefsIndex(sourceSurvey)
  const targetIndex = buildNodeDefsIndex(targetSurvey)
  const matches = matchNodeDefs({ sourceIndex, targetIndex })
  const nodeDefDiffs = compareNodeDefs({ sourceIndex, targetIndex, matches })

  const categoryMatches = matchCategories({ sourceSurvey, targetSurvey })
  const categoryDiffs = compareCategories({
    matches: categoryMatches,
    sourceItemsByCategoryUuid,
    targetItemsByCategoryUuid,
  })
  const { diffs: taxonomyDiffs, taxonomyTargetUuidBySourceUuid } = compareTaxonomies({ sourceSurvey, targetSurvey })

  const targetSurveyInfo = Survey.getSurveyInfo(targetSurvey)
  evaluateApplicability({
    context: {
      sourceSurvey,
      sourceIndex,
      targetIndex,
      matches,
      categoryDiffBySourceUuid: Object.fromEntries(
        categoryDiffs.filter((diff) => diff.sourceUuid).map((diff) => [diff.sourceUuid, diff])
      ),
      taxonomyTargetUuidBySourceUuid,
      targetTemplate: Survey.isTemplate(targetSurveyInfo),
      targetCycleKeys: Survey.getCycleKeys(targetSurveyInfo),
    },
    nodeDefDiffs,
    categoryDiffs,
  })

  const surveyInfo = compareSurveyInfo({ sourceSurvey, targetSurvey })
  const counts = {
    nodeDefs: countByStatus(nodeDefDiffs),
    categories: countByStatus(categoryDiffs),
    taxonomies: countByStatus(taxonomyDiffs),
  }
  const identical =
    surveyInfo.length === 0 &&
    [...nodeDefDiffs, ...categoryDiffs, ...taxonomyDiffs].every((diff) => diff.status === SurveyCompareStatus.identical)

  return { identical, surveyInfo, nodeDefs: nodeDefDiffs, categories: categoryDiffs, taxonomies: taxonomyDiffs, counts }
}
