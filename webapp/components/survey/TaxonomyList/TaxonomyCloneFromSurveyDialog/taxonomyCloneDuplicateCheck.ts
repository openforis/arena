import { Taxonomy as ArenaTaxonomy } from '@openforis/arena-core'

import * as Taxonomy from '@core/survey/taxonomy'
import {
  checkCloneFromSurveyDuplicate,
  CloneFromSurveyDuplicateCheckResult,
} from '@core/survey/cloneFromSurveyDuplicateCheck'

export type TaxonomyDuplicateCheckResult = CloneFromSurveyDuplicateCheckResult

/**
 * Checks whether the source taxonomy to be cloned would clash (by uuid or name) with an existing taxonomy in the current survey.
 *
 * @param {object} params - The params.
 * @param {object[]} params.currentSurveyTaxonomies - Taxonomies already existing in the current survey.
 * @param {object | null} params.sourceTaxonomy - Taxonomy selected to be cloned.
 * @returns {TaxonomyDuplicateCheckResult} Duplicate check result, or null if no clash was found.
 */
export const getTaxonomyDuplicateCheck = ({
  currentSurveyTaxonomies,
  sourceTaxonomy,
}: {
  currentSurveyTaxonomies: ArenaTaxonomy[]
  sourceTaxonomy: ArenaTaxonomy | null
}): TaxonomyDuplicateCheckResult => {
  if (!sourceTaxonomy) return null

  return checkCloneFromSurveyDuplicate({
    targetSurveyItems: currentSurveyTaxonomies,
    sourceItem: sourceTaxonomy,
    getUuid: Taxonomy.getUuid,
    getName: Taxonomy.getName,
    uuidDuplicateErrorKey: 'validationErrors:taxonomyImport.uuidDuplicate',
    nameDuplicateErrorKey: 'validationErrors:taxonomyImport.nameDuplicate',
  })
}
