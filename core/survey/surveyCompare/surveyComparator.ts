import * as Survey from '@core/survey/survey'

import { SurveyCompareParams, SurveyCompareResult, SurveyCompareStatus } from './surveyCompareTypes'
import { buildNodeDefsIndex } from './surveyCompareNodeDefsIndex'
import { compareNodeDefs, matchNodeDefs } from './surveyCompareNodeDefs'
import { compareCategories, matchCategories } from './surveyCompareCategories'
import { compareTaxonomies } from './surveyCompareTaxonomies'
import { compareSurveyFiles, compareSurveyInfo, surveyInfoChangeId } from './surveyCompareSurveyInfo'
import { evaluateApplicability } from './surveyCompareApplicability'

const countByStatus = (diffs: { status: string }[]) => ({
  added: diffs.filter((diff) => diff.status === SurveyCompareStatus.added).length,
  changed: diffs.filter((diff) => diff.status === SurveyCompareStatus.changed).length,
  removed: diffs.filter((diff) => diff.status === SurveyCompareStatus.removed).length,
})

const indexBySourceUuid = <T extends { sourceUuid?: string }>(diffs: T[]): Record<string, T> =>
  Object.fromEntries(diffs.filter((diff) => diff.sourceUuid).map((diff) => [diff.sourceUuid, diff]))

/**
 * Compares a source survey (e.g. uploaded from another environment) with a target survey (the one to update).
 * Category items and taxa must be passed separately (they are not part of the survey object).
 * @param {SurveyCompareParams} params - The parameters.
 * @returns {SurveyCompareResult} - The comparison result.
 */
export const compareSurveys = ({
  sourceSurvey,
  targetSurvey,
  sourceItemsByCategoryUuid,
  targetItemsByCategoryUuid,
  sourceTaxaByTaxonomyUuid = {},
  targetTaxaByTaxonomyUuid = {},
  manualMatches = {},
}: SurveyCompareParams): SurveyCompareResult => {
  const sourceIndex = buildNodeDefsIndex(sourceSurvey)
  const targetIndex = buildNodeDefsIndex(targetSurvey)
  const matches = matchNodeDefs({ sourceIndex, targetIndex, manualMatches })
  const nodeDefDiffs = compareNodeDefs({ sourceIndex, targetIndex, matches })

  const categoryMatches = matchCategories({ sourceSurvey, targetSurvey })
  const categoryDiffs = compareCategories({
    matches: categoryMatches,
    sourceItemsByCategoryUuid,
    targetItemsByCategoryUuid,
  })
  const taxonomyDiffs = compareTaxonomies({
    sourceSurvey,
    targetSurvey,
    sourceTaxaByTaxonomyUuid,
    targetTaxaByTaxonomyUuid,
  })
  const surveyInfoDiffs = compareSurveyInfo({ sourceSurvey, targetSurvey })
  const surveyFileDiffs = compareSurveyFiles({ sourceSurvey, targetSurvey })

  const targetSurveyInfo = Survey.getSurveyInfo(targetSurvey)
  const cyclesChangeId = surveyInfoChangeId(Survey.infoKeys.cycles)
  evaluateApplicability({
    context: {
      sourceSurvey,
      targetSurvey,
      sourceIndex,
      targetIndex,
      matches,
      categoryDiffBySourceUuid: indexBySourceUuid(categoryDiffs),
      taxonomyDiffBySourceUuid: indexBySourceUuid(taxonomyDiffs),
      targetTemplate: Survey.isTemplate(targetSurveyInfo),
      targetCycleKeys: Survey.getCycleKeys(targetSurveyInfo),
      cyclesChangeId: surveyInfoDiffs.some((diff) => diff.id === cyclesChangeId) ? cyclesChangeId : undefined,
      sourceCycleKeys: Survey.getCycleKeys(Survey.getSurveyInfo(sourceSurvey)),
    },
    nodeDefDiffs,
    categoryDiffs,
    taxonomyDiffs,
    otherChanges: surveyInfoDiffs,
  })

  const counts = {
    nodeDefs: countByStatus(nodeDefDiffs),
    categories: countByStatus(categoryDiffs),
    taxonomies: countByStatus(taxonomyDiffs),
    surveyFiles: countByStatus(surveyFileDiffs),
  }
  const identical =
    surveyInfoDiffs.length === 0 &&
    surveyFileDiffs.length === 0 &&
    [...nodeDefDiffs, ...categoryDiffs, ...taxonomyDiffs].every((diff) => diff.status === SurveyCompareStatus.identical)

  return {
    identical,
    surveyInfo: surveyInfoDiffs,
    surveyFiles: surveyFileDiffs,
    nodeDefs: nodeDefDiffs,
    categories: categoryDiffs,
    taxonomies: taxonomyDiffs,
    counts,
  }
}
