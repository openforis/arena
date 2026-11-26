import type { ArenaAnyNodeDef, ArenaSurvey, ArenaTaxon } from '@openforis/arena-core'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as Taxonomy from '@core/survey/taxonomy'
import * as TaxonomyRepository from '../repository/taxonomyRepository'

const getTaxonByCode = ({
  survey,
  taxonomyUuid,
  taxonCode,
  draft = false,
}: {
  survey: ArenaSurvey
  taxonomyUuid: string
  taxonCode: string
  draft?: boolean
}) => {
  const surveyId = Survey.getId(survey)
  return TaxonomyRepository.fetchTaxonWithVernacularNamesByCode({
    surveyId,
    taxonomyUuid,
    taxonCode,
    draft,
  })
}

const getTaxonByUuid = ({
  survey,
  taxonomyUuid,
  taxonUuid,
  draft = false,
}: {
  survey: ArenaSurvey
  taxonomyUuid: string
  taxonUuid: string
  draft?: boolean
}) => {
  const surveyId = Survey.getId(survey)
  return TaxonomyRepository.fetchTaxonWithVernacularNamesByUuid({ surveyId, taxonomyUuid, taxonUuid, draft })
}

/**
 * Gets a taxon from the survey ref data or, for big taxonomies (not in the ref data), from the database.
 * @param {object} params - The parameters.
 * @param {object} params.nodeDef - The taxon node definition.
 * @returns {Promise<import('@openforis/arena-core').ArenaTaxon|null>} - The taxon, or null if not found.
 */
const getOrFetchTaxon = ({
  survey,
  nodeDef,
  taxonUuid,
}: {
  survey: ArenaSurvey
  nodeDef: ArenaAnyNodeDef
  taxonUuid: string
}): Promise<ArenaTaxon | null> => {
  const taxonInSurvey = Survey.getTaxonByUuid(taxonUuid)(survey)
  if (taxonInSurvey) {
    return Promise.resolve(taxonInSurvey)
  }
  const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
  const taxonomy = Survey.getTaxonomyByUuid(taxonomyUuid)(survey)
  if (!Taxonomy.isBigTaxonomy(taxonomy)) {
    return Promise.resolve(null)
  }
  return getTaxonByUuid({ survey, taxonomyUuid, taxonUuid })
}

export const TaxonProviderDefault = {
  getTaxonByCode,
  getTaxonByUuid,
  getOrFetchTaxon,
}
