import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Taxon from '@core/survey/taxon'
import * as ObjectUtils from '@core/objectUtils'

import { CategoryItemsByCategoryUuid, TaxaByTaxonomyUuid } from './surveyCompareTypes'
import { buildNodeDefsIndex } from './surveyCompareNodeDefsIndex'
import { normalizeNodeDef } from './surveyCompareNodeDefNormalizer'
import { indexItemsByCodePath, normalizeCategory, normalizeItem } from './surveyCompareCategories'
import { indexTaxaByCode, normalizeTaxon, normalizeTaxonomy } from './surveyCompareTaxonomies'
import { normalizeSurveyInfoProp } from './surveyCompareSurveyInfo'

/**
 * Variants of the survey definition fingerprint.
 * - strict: uuids are included; equal only for copies of the same survey (e.g. exported and imported).
 * - structural: elements are identified by name/code; equal also for surveys created separately.
 */
export const SurveyFingerprintType = {
  strict: 'strict',
  structural: 'structural',
} as const

export type SurveyFingerprintType = (typeof SurveyFingerprintType)[keyof typeof SurveyFingerprintType]

const { infoKeys } = Survey

// survey info props defining the data collected (name, labels and branding are excluded)
const fingerprintSurveyInfoProps: string[] = [
  infoKeys.languages,
  infoKeys.cycles,
  infoKeys.defaultCycleKey,
  infoKeys.srs,
  infoKeys.keepNonApplicableValues,
  infoKeys.sampleBasedImageInterpretationEnabled,
  infoKeys.samplingPolygon,
  infoKeys.areaOfInterest,
  infoKeys.userExtraPropDefs,
]

const byKey = (entryA: { key: string }, entryB: { key: string }): number => entryA.key.localeCompare(entryB.key)

const normalizeInfo = (survey: any): Record<string, any> => {
  const props = ObjectUtils.getProps(Survey.getSurveyInfo(survey)) ?? {}
  const result = {}
  for (const key of fingerprintSurveyInfoProps) {
    const value = normalizeSurveyInfoProp({ key, value: props[key] })
    if (value !== undefined) result[key] = value
  }
  return result
}

const withUuid = (strict: boolean, uuid: string, data: Record<string, any>) => (strict ? { uuid, ...data } : data)

const normalizeNodeDefs = ({ survey, strict }) => {
  const index = buildNodeDefsIndex(survey)
  return Object.values(index.byUuid)
    .map((nodeDef) => {
      const uuid = NodeDef.getUuid(nodeDef)
      return { key: index.pathByUuid[uuid] ?? uuid, ...withUuid(strict, uuid, normalizeNodeDef({ index, nodeDef })) }
    })
    .sort(byKey)
}

const normalizeCategories = ({ survey, itemsByCategoryUuid, strict }) =>
  Survey.getCategoriesArray(survey)
    .map((category) => {
      const categoryUuid = Category.getUuid(category)
      const items = Object.entries(indexItemsByCodePath(itemsByCategoryUuid[categoryUuid]))
        .map(([key, { item }]) => ({ key, ...withUuid(strict, CategoryItem.getUuid(item), normalizeItem(item)) }))
        .sort(byKey)
      return { key: Category.getName(category), ...withUuid(strict, categoryUuid, normalizeCategory(category)), items }
    })
    .sort(byKey)

const normalizeTaxonomies = ({ survey, taxaByTaxonomyUuid, strict }) =>
  Survey.getTaxonomiesArray(survey)
    .map((taxonomy) => {
      const taxonomyUuid = Taxonomy.getUuid(taxonomy)
      const taxa = Object.entries(indexTaxaByCode(taxaByTaxonomyUuid[taxonomyUuid]))
        .map(([key, taxon]) => ({ key, ...withUuid(strict, Taxon.getUuid(taxon), normalizeTaxon(taxon)) }))
        .sort(byKey)
      return { key: Taxonomy.getName(taxonomy), ...withUuid(strict, taxonomyUuid, normalizeTaxonomy(taxonomy)), taxa }
    })
    .sort(byKey)

/**
 * Builds the canonical (normalized and sorted) representation of a survey definition, used to compute its fingerprint.
 * Ids, dates, publishing status and validation are not part of it.
 * @param {object} params - The parameters.
 * @param {any} params.survey - The survey (node defs, categories and taxonomies).
 * @param {CategoryItemsByCategoryUuid} params.itemsByCategoryUuid - Category items by category uuid.
 * @param {TaxaByTaxonomyUuid} params.taxaByTaxonomyUuid - Taxa by taxonomy uuid.
 * @param {SurveyFingerprintType} params.type - Fingerprint variant.
 * @returns {string} - The canonical representation (JSON).
 */
export const buildSurveyFingerprintContent = ({
  survey,
  itemsByCategoryUuid = {},
  taxaByTaxonomyUuid = {},
  type,
}: {
  survey: any
  itemsByCategoryUuid?: CategoryItemsByCategoryUuid
  taxaByTaxonomyUuid?: TaxaByTaxonomyUuid
  type: SurveyFingerprintType
}): string => {
  const strict = type === SurveyFingerprintType.strict
  return JSON.stringify({
    info: normalizeInfo(survey),
    nodeDefs: normalizeNodeDefs({ survey, strict }),
    categories: normalizeCategories({ survey, itemsByCategoryUuid, strict }),
    taxonomies: normalizeTaxonomies({ survey, taxaByTaxonomyUuid, strict }),
  })
}
