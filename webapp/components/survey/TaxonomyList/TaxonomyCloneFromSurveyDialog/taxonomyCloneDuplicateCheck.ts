import { Taxonomy as ArenaTaxonomy } from '@openforis/arena-core'

import * as Taxonomy from '@core/survey/taxonomy'

export type TaxonomyDuplicateCheckResult = {
  key: string
  params: { name: string }
} | null

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

  const sourceTaxonomyUuid = Taxonomy.getUuid(sourceTaxonomy)
  const sourceTaxonomyName = Taxonomy.getName(sourceTaxonomy)

  // taxonomy uuids are preserved when cloning: if this exact taxonomy has already been cloned
  // into the current survey before (even if renamed since), cloning it again is not allowed
  const taxonomyWithSameUuid = currentSurveyTaxonomies.find(
    (taxonomy: ArenaTaxonomy) => Taxonomy.getUuid(taxonomy) === sourceTaxonomyUuid
  )
  if (taxonomyWithSameUuid) {
    return {
      key: 'validationErrors:taxonomyImport.uuidDuplicate',
      params: { name: Taxonomy.getName(taxonomyWithSameUuid) },
    }
  }

  if (currentSurveyTaxonomies.some((taxonomy: ArenaTaxonomy) => Taxonomy.getName(taxonomy) === sourceTaxonomyName)) {
    return {
      key: 'validationErrors:taxonomyImport.nameDuplicate',
      params: { name: sourceTaxonomyName },
    }
  }

  return null
}
