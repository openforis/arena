import * as Survey from '@core/survey/survey'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'

import {
  SurveyCompareApplicabilityStatus,
  SurveyCompareMatchType,
  SurveyComparePropGroup,
  SurveyCompareReason,
  SurveyCompareStatus,
  SurveyCompareTaxonDiff,
  SurveyCompareTaxonomyDiff,
  TaxaByTaxonomyUuid,
} from './surveyCompareTypes'
import { getDifferentKeys, normalizeValue } from './surveyCompareValues'

export const taxonomyChangeId = (uuid: string): string => `taxonomy:${uuid}`
export const taxonomyRemovalChangeId = (uuid: string): string => `taxonomyRemoval:${uuid}`

/** Taxonomy props that can be updated from the comparison. */
export const updatableTaxonomyProps: string[] = [
  Taxonomy.keysProps.name,
  Taxonomy.keysProps.descriptions,
  Taxonomy.keysProps.vernacularLanguageCodes,
  Taxonomy.keysProps.extraPropsDefs,
]

export const normalizeTaxonomy = (taxonomy: any) =>
  normalizeValue({
    name: Taxonomy.getName(taxonomy),
    descriptions: Taxonomy.getDescriptions(taxonomy),
    vernacularLanguageCodes: Taxonomy.getVernacularLanguageCodes(taxonomy),
    extraPropsDefs: Taxonomy.getExtraPropsDefs(taxonomy),
  }) ?? {}

/**
 * Key identifying a vernacular name in a taxon (language and name).
 * @param {any} vernacularName - The vernacular name.
 * @returns {string} - The key.
 */
export const vernacularNameKey = (vernacularName: any): string =>
  `${TaxonVernacularName.getLang(vernacularName)}|${TaxonVernacularName.getName(vernacularName)}`

const normalizeVernacularNames = (taxon: any) => {
  const result: Record<string, string[]> = {}
  for (const [lang, names] of Object.entries(Taxon.getVernacularNames(taxon) as Record<string, any[]>)) {
    result[lang] = names.map(TaxonVernacularName.getName).sort((nameA, nameB) => nameA.localeCompare(nameB))
  }
  return result
}

export const normalizeTaxon = (taxon: any) =>
  normalizeValue({
    family: Taxon.getFamily(taxon),
    genus: Taxon.getGenus(taxon),
    scientificName: Taxon.getScientificName(taxon),
    extra: Taxon.getExtra(taxon),
    vernacularNames: normalizeVernacularNames(taxon),
  }) ?? {}

/**
 * Indexes taxa by code.
 * @param {any[]} taxa - The taxa.
 * @returns {Record<string, any>} - Taxa indexed by code.
 */
export const indexTaxaByCode = (taxa: any[] = []): Record<string, any> =>
  Object.fromEntries(taxa.map((taxon) => [Taxon.getCode(taxon), taxon]))

/**
 * Vernacular names of the target taxon that are not in the source one.
 * @param {object} params - The parameters.
 * @param {any} params.sourceTaxon - Source taxon.
 * @param {any} params.targetTaxon - Target taxon.
 * @returns {any[]} - The vernacular names only in the target taxon.
 */
export const getTargetOnlyVernacularNames = ({ sourceTaxon, targetTaxon }): any[] => {
  const sourceKeys = new Set(Taxon.getVernacularNamesArray(sourceTaxon).map(vernacularNameKey))
  return Taxon.getVernacularNamesArray(targetTaxon).filter(
    (vernacularName) => !sourceKeys.has(vernacularNameKey(vernacularName))
  )
}

const compareTaxa = ({ sourceTaxa, targetTaxa }) => {
  const sourceIndex = indexTaxaByCode(sourceTaxa)
  const targetIndex = indexTaxaByCode(targetTaxa)
  const diffs: SurveyCompareTaxonDiff[] = []
  const targetOnlyVernacularNames: any[] = []
  for (const [code, sourceTaxon] of Object.entries(sourceIndex)) {
    const targetTaxon = targetIndex[code]
    if (!targetTaxon) {
      diffs.push({ code, status: SurveyCompareStatus.added, propDiffs: [] })
      continue
    }
    const source = normalizeTaxon(sourceTaxon)
    const target = normalizeTaxon(targetTaxon)
    const propDiffs = getDifferentKeys({ source, target }).map((key) => ({
      key,
      group: SurveyComparePropGroup.props,
      source: source[key],
      target: target[key],
    }))
    if (propDiffs.length > 0) {
      diffs.push({ code, status: SurveyCompareStatus.changed, propDiffs })
      targetOnlyVernacularNames.push(...getTargetOnlyVernacularNames({ sourceTaxon, targetTaxon }))
    }
  }
  for (const [code, targetTaxon] of Object.entries(targetIndex)) {
    if (!sourceIndex[code]) {
      diffs.push({
        code,
        status: SurveyCompareStatus.removed,
        propDiffs: [],
        published: targetTaxon.published || undefined,
      })
    }
  }
  return { diffs, targetOnlyVernacularNames }
}

const countByStatus = (items: { status: string }[]) => ({
  added: items.filter((item) => item.status === SurveyCompareStatus.added).length,
  changed: items.filter((item) => item.status === SurveyCompareStatus.changed).length,
  removed: items.filter((item) => item.status === SurveyCompareStatus.removed).length,
})

const toApplicability = ({ count, reasons }) => {
  if (count === 0) return { status: SurveyCompareApplicabilityStatus.notApplicable, reasons }
  return {
    status:
      reasons.length > 0
        ? SurveyCompareApplicabilityStatus.applicableWithWarning
        : SurveyCompareApplicabilityStatus.applicable,
    reasons,
  }
}

// taxa and vernacular names only in the target survey: unpublished ones can be deleted, published ones are kept
const getTaxonomyRemoval = ({ sourceUuid, taxa, targetOnlyVernacularNames }) => {
  const removedTaxa = taxa.filter((taxon) => taxon.status === SurveyCompareStatus.removed)
  if (removedTaxa.length + targetOnlyVernacularNames.length === 0) return undefined
  const reasons = []
  if (removedTaxa.some((taxon) => taxon.published)) reasons.push(SurveyCompareReason.publishedTaxaKept)
  if (targetOnlyVernacularNames.some((vernacularName) => vernacularName.published)) {
    reasons.push(SurveyCompareReason.publishedVernacularNamesKept)
  }
  const count =
    removedTaxa.filter((taxon) => !taxon.published).length +
    targetOnlyVernacularNames.filter((vernacularName) => !vernacularName.published).length
  return {
    id: taxonomyRemovalChangeId(sourceUuid),
    status: SurveyCompareStatus.removed,
    applicability: toApplicability({ count, reasons }),
    dependsOn: [],
    linkedTo: [],
  }
}

const findTaxonomyMatch = ({ source, targetTaxonomies, targetsMatched }) => {
  const byUuid = targetTaxonomies.find((taxonomy) => Taxonomy.getUuid(taxonomy) === Taxonomy.getUuid(source))
  if (byUuid) return { target: byUuid, matchedBy: SurveyCompareMatchType.uuid }
  const byName = targetTaxonomies.find(
    (taxonomy) =>
      !targetsMatched.has(Taxonomy.getUuid(taxonomy)) && Taxonomy.getName(taxonomy) === Taxonomy.getName(source)
  )
  return byName ? { target: byName, matchedBy: SurveyCompareMatchType.name } : {}
}

const compareMatchedTaxonomies = ({ source, target, matchedBy, sourceTaxa, targetTaxa }): SurveyCompareTaxonomyDiff => {
  const sourceUuid = Taxonomy.getUuid(source)
  const sourceNormalized = normalizeTaxonomy(source)
  const targetNormalized = normalizeTaxonomy(target)
  const propDiffs = getDifferentKeys({ source: sourceNormalized, target: targetNormalized }).map((key) => ({
    key,
    group: SurveyComparePropGroup.props,
    source: sourceNormalized[key],
    target: targetNormalized[key],
  }))
  const { diffs: taxa, targetOnlyVernacularNames } = compareTaxa({ sourceTaxa, targetTaxa })
  const taxaCount = countByStatus(taxa)
  const changed = propDiffs.length > 0 || taxa.length > 0
  const hasApplicableChanges = propDiffs.length > 0 || taxaCount.added + taxaCount.changed > 0
  return {
    id: taxonomyChangeId(sourceUuid),
    sourceUuid,
    targetUuid: Taxonomy.getUuid(target),
    matchedBy,
    name: Taxonomy.getName(source),
    status: changed ? SurveyCompareStatus.changed : SurveyCompareStatus.identical,
    propDiffs,
    taxa,
    taxaCount,
    applicability: hasApplicableChanges
      ? { status: SurveyCompareApplicabilityStatus.applicable, reasons: [] }
      : undefined,
    removal: getTaxonomyRemoval({ sourceUuid, taxa, targetOnlyVernacularNames }),
    dependsOn: [],
    linkedTo: [],
  }
}

const newUnmatchedTaxonomyDiff = ({ taxonomy, taxa, added }): SurveyCompareTaxonomyDiff => {
  const uuid = Taxonomy.getUuid(taxonomy)
  return {
    id: taxonomyChangeId(uuid),
    sourceUuid: added ? uuid : undefined,
    targetUuid: added ? undefined : uuid,
    name: Taxonomy.getName(taxonomy),
    status: added ? SurveyCompareStatus.added : SurveyCompareStatus.removed,
    propDiffs: [],
    taxa: [],
    taxaCount: { added: added ? taxa.length : 0, changed: 0, removed: added ? 0 : taxa.length },
    // removals: applicability depends on the node defs using the taxonomy (see evaluateApplicability)
    applicability: { status: SurveyCompareApplicabilityStatus.applicable, reasons: [] },
    dependsOn: [],
    linkedTo: [],
  }
}

/**
 * Compares the taxonomies (and their taxa) of two surveys. Taxonomies are matched by uuid, then by name; taxa by code.
 * @param {object} params - The parameters.
 * @param {any} params.sourceSurvey - Source survey.
 * @param {any} params.targetSurvey - Target survey.
 * @param {TaxaByTaxonomyUuid} [params.sourceTaxaByTaxonomyUuid] - Taxa of the source survey taxonomies.
 * @param {TaxaByTaxonomyUuid} [params.targetTaxaByTaxonomyUuid] - Taxa of the target survey taxonomies.
 * @returns {SurveyCompareTaxonomyDiff[]} - The taxonomy diffs, sorted by name.
 */
export const compareTaxonomies = ({
  sourceSurvey,
  targetSurvey,
  sourceTaxaByTaxonomyUuid = {},
  targetTaxaByTaxonomyUuid = {},
}: {
  sourceSurvey: any
  targetSurvey: any
  sourceTaxaByTaxonomyUuid?: TaxaByTaxonomyUuid
  targetTaxaByTaxonomyUuid?: TaxaByTaxonomyUuid
}): SurveyCompareTaxonomyDiff[] => {
  const targetTaxonomies = Survey.getTaxonomiesArray(targetSurvey)
  const targetsMatched = new Set<string>()
  const diffs: SurveyCompareTaxonomyDiff[] = []

  for (const source of Survey.getTaxonomiesArray(sourceSurvey)) {
    const sourceTaxa = sourceTaxaByTaxonomyUuid[Taxonomy.getUuid(source)] ?? []
    const { target, matchedBy } = findTaxonomyMatch({ source, targetTaxonomies, targetsMatched })
    if (target) {
      targetsMatched.add(Taxonomy.getUuid(target))
      const targetTaxa = targetTaxaByTaxonomyUuid[Taxonomy.getUuid(target)] ?? []
      diffs.push(compareMatchedTaxonomies({ source, target, matchedBy, sourceTaxa, targetTaxa }))
    } else {
      diffs.push(newUnmatchedTaxonomyDiff({ taxonomy: source, taxa: sourceTaxa, added: true }))
    }
  }
  for (const target of targetTaxonomies) {
    if (!targetsMatched.has(Taxonomy.getUuid(target))) {
      const taxa = targetTaxaByTaxonomyUuid[Taxonomy.getUuid(target)] ?? []
      diffs.push(newUnmatchedTaxonomyDiff({ taxonomy: target, taxa, added: false }))
    }
  }
  return diffs.sort((diffA, diffB) => diffA.name.localeCompare(diffB.name))
}
