import type { ArenaSurvey, ArenaTaxonomy } from '@openforis/arena-core'
import { Surveys } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as Taxonomy from '../taxonomy'

import * as SurveyNodeDefs from './surveyNodeDefs'

type TaxonomiesByUuid = Record<string, ArenaTaxonomy>

const taxonomiesKey = 'taxonomies'

// ====== READ
export const getTaxonomies = (survey: ArenaSurvey): TaxonomiesByUuid =>
  A.propOr({}, taxonomiesKey)(survey) as TaxonomiesByUuid

export const getTaxonomiesArray = (survey: ArenaSurvey): ArenaTaxonomy[] => Object.values(getTaxonomies(survey))

export const getTaxonomyByUuid =
  (uuid: string) =>
  (survey: ArenaSurvey): ArenaTaxonomy | undefined =>
    Surveys.getTaxonomyByUuid({ survey, taxonomyUuid: uuid })

export const getTaxonomyByName =
  (name: string) =>
  (survey: ArenaSurvey): ArenaTaxonomy | undefined =>
    getTaxonomiesArray(survey).find((taxonomy) => Taxonomy.getName(taxonomy) === name)

// ====== UPDATE
export const assocTaxonomies =
  (newTaxonomies: TaxonomiesByUuid) =>
  (survey: ArenaSurvey): ArenaSurvey =>
    A.assoc(taxonomiesKey, newTaxonomies, survey)

// ====== UTILS
export const isTaxonomyUnused =
  (taxonomy: ArenaTaxonomy) =>
  (survey: ArenaSurvey): boolean =>
    A.isEmpty(SurveyNodeDefs.getNodeDefsByTaxonomyUuid(Taxonomy.getUuid(taxonomy))(survey))
