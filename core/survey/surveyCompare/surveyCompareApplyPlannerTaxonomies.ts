import { uuidv4 } from '@core/uuid'
import * as Survey from '@core/survey/survey'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'

import { SurveyCompareParams, SurveyCompareStatus, SurveyCompareTaxonomyDiff } from './surveyCompareTypes'
import {
  getTargetOnlyVernacularNames,
  indexTaxaByCode,
  updatableTaxonomyProps,
  vernacularNameKey,
} from './surveyCompareTaxonomies'

export interface TaxonomiesApplyPlan {
  taxonomiesToInsert: { taxonomy: any; taxa: any[] }[]
  taxonomyPropsToUpdate: { taxonomyUuid: string; key: string; value: any }[]
  taxaToInsert: { taxonomyUuid: string; taxa: any[] }[]
  taxaToUpdate: { taxonomyUuid: string; taxa: any[] }[]
  taxonUuidsToDelete: string[]
  vernacularNameUuidsToDelete: string[]
  taxonomyUuidsToDelete: string[]
}

export const newTaxonomiesApplyPlan = (): TaxonomiesApplyPlan => ({
  taxonomiesToInsert: [],
  taxonomyPropsToUpdate: [],
  taxaToInsert: [],
  taxaToUpdate: [],
  taxonUuidsToDelete: [],
  vernacularNameUuidsToDelete: [],
  taxonomyUuidsToDelete: [],
})

interface UsedUuids {
  taxa: Set<string>
  vernacularNames: Set<string>
}

const getUsedUuids = (targetTaxaByTaxonomyUuid: Record<string, any[]>): UsedUuids => {
  const taxa = Object.values(targetTaxaByTaxonomyUuid).flat()
  return {
    taxa: new Set(taxa.map(Taxon.getUuid)),
    vernacularNames: new Set(taxa.flatMap(Taxon.getVernacularNamesArray).map(TaxonVernacularName.getUuid)),
  }
}

// uuids are kept unless already used in the target survey
const keepOrNewUuid = (uuid: string, used: Set<string>): string => (used.has(uuid) ? uuidv4() : uuid)

const withoutIndex = (props: Record<string, any>) => {
  const result = { ...props }
  delete result[Taxon.propKeys.index]
  return result
}

const newVernacularName = ({ vernacularName, usedUuids }) => ({
  uuid: keepOrNewUuid(TaxonVernacularName.getUuid(vernacularName), usedUuids.vernacularNames),
  props: {
    [TaxonVernacularName.keysProps.lang]: TaxonVernacularName.getLang(vernacularName),
    [TaxonVernacularName.keysProps.name]: TaxonVernacularName.getName(vernacularName),
  },
})

const groupByLang = (vernacularNames: any[]): Record<string, any[]> => {
  const result: Record<string, any[]> = {}
  for (const vernacularName of vernacularNames) {
    const lang = TaxonVernacularName.getLang(vernacularName)
    result[lang] = [...(result[lang] ?? []), vernacularName]
  }
  return result
}

const newTaxonFromSource = ({ sourceTaxon, taxonomyUuid, usedUuids }) => ({
  uuid: keepOrNewUuid(Taxon.getUuid(sourceTaxon), usedUuids.taxa),
  taxonomyUuid,
  props: withoutIndex(Taxon.getProps(sourceTaxon)),
  vernacularNames: groupByLang(
    Taxon.getVernacularNamesArray(sourceTaxon).map((vernacularName) => newVernacularName({ vernacularName, usedUuids }))
  ),
})

// vernacular names of the target taxon are kept (removed ones are deleted by the removal change), new ones are added
const newUpdatedTaxon = ({ sourceTaxon, targetTaxon, usedUuids }) => {
  const targetNames = Taxon.getVernacularNamesArray(targetTaxon)
  const targetKeys = new Set(targetNames.map(vernacularNameKey))
  const namesToAdd = Taxon.getVernacularNamesArray(sourceTaxon)
    .filter((vernacularName) => !targetKeys.has(vernacularNameKey(vernacularName)))
    .map((vernacularName) => newVernacularName({ vernacularName, usedUuids }))
  return {
    uuid: Taxon.getUuid(targetTaxon),
    taxonomyUuid: Taxon.getTaxonomyUuid(targetTaxon),
    props: withoutIndex(Taxon.getProps(sourceTaxon)),
    vernacularNames: groupByLang(namesToAdd),
  }
}

const planTaxonomyInsert = ({ params, diff, plan, usedUuids }) => {
  const taxonomy = Survey.getTaxonomyByUuid(diff.sourceUuid)(params.sourceSurvey)
  const taxonomyUuid = Taxonomy.getUuid(taxonomy)
  const taxa = (params.sourceTaxaByTaxonomyUuid?.[taxonomyUuid] ?? []).map((sourceTaxon) =>
    newTaxonFromSource({ sourceTaxon, taxonomyUuid, usedUuids })
  )
  plan.taxonomiesToInsert.push({ taxonomy, taxa })
}

const planTaxonomyUpdate = ({ params, diff, plan, usedUuids }) => {
  const sourceTaxonomy = Survey.getTaxonomyByUuid(diff.sourceUuid)(params.sourceSurvey)
  for (const { key } of diff.propDiffs) {
    if (updatableTaxonomyProps.includes(key)) {
      plan.taxonomyPropsToUpdate.push({
        taxonomyUuid: diff.targetUuid,
        key,
        value: Taxonomy.getProps(sourceTaxonomy)[key] ?? null,
      })
    }
  }
  const sourceIndex = indexTaxaByCode(params.sourceTaxaByTaxonomyUuid?.[diff.sourceUuid])
  const targetIndex = indexTaxaByCode(params.targetTaxaByTaxonomyUuid?.[diff.targetUuid])
  const taxaToInsert = []
  const taxaToUpdate = []
  for (const { code, status } of diff.taxa) {
    const sourceTaxon = sourceIndex[code]
    if (status === SurveyCompareStatus.added) {
      taxaToInsert.push(newTaxonFromSource({ sourceTaxon, taxonomyUuid: diff.targetUuid, usedUuids }))
    } else if (status === SurveyCompareStatus.changed) {
      taxaToUpdate.push(newUpdatedTaxon({ sourceTaxon, targetTaxon: targetIndex[code], usedUuids }))
    }
  }
  if (taxaToInsert.length > 0) plan.taxaToInsert.push({ taxonomyUuid: diff.targetUuid, taxa: taxaToInsert })
  if (taxaToUpdate.length > 0) plan.taxaToUpdate.push({ taxonomyUuid: diff.targetUuid, taxa: taxaToUpdate })
}

// deletes the unpublished taxa and vernacular names only in the target taxonomy
const planTaxonomyRemoval = ({ params, diff, plan }) => {
  const sourceIndex = indexTaxaByCode(params.sourceTaxaByTaxonomyUuid?.[diff.sourceUuid])
  const targetIndex = indexTaxaByCode(params.targetTaxaByTaxonomyUuid?.[diff.targetUuid])
  for (const { code, status, published } of diff.taxa) {
    const targetTaxon = targetIndex[code]
    if (status === SurveyCompareStatus.removed && !published) {
      plan.taxonUuidsToDelete.push(Taxon.getUuid(targetTaxon))
    } else if (status === SurveyCompareStatus.changed) {
      const vernacularNames = getTargetOnlyVernacularNames({ sourceTaxon: sourceIndex[code], targetTaxon })
      plan.vernacularNameUuidsToDelete.push(
        ...vernacularNames
          .filter((vernacularName) => !vernacularName.published)
          .map((vernacularName) => TaxonVernacularName.getUuid(vernacularName))
      )
    }
  }
}

/**
 * Builds the changes to the taxonomies needed to apply the selected changes.
 * @param {object} params - The parameters.
 * @param {SurveyCompareParams} params.params - Comparison parameters.
 * @param {SurveyCompareTaxonomyDiff[]} params.diffs - Taxonomy diffs.
 * @param {Set<string>} params.appliedIds - Ids of the changes to apply.
 * @param {TaxonomiesApplyPlan} params.plan - The plan to fill.
 * @returns {void}
 */
export const planTaxonomies = ({
  params,
  diffs,
  appliedIds,
  plan,
}: {
  params: SurveyCompareParams
  diffs: SurveyCompareTaxonomyDiff[]
  appliedIds: Set<string>
  plan: TaxonomiesApplyPlan
}): void => {
  const usedUuids = getUsedUuids(params.targetTaxaByTaxonomyUuid ?? {})
  for (const diff of diffs) {
    if (appliedIds.has(diff.id)) {
      if (diff.status === SurveyCompareStatus.added) {
        planTaxonomyInsert({ params, diff, plan, usedUuids })
      } else if (diff.status === SurveyCompareStatus.changed) {
        planTaxonomyUpdate({ params, diff, plan, usedUuids })
      } else if (diff.status === SurveyCompareStatus.removed) {
        plan.taxonomyUuidsToDelete.push(diff.targetUuid)
      }
    }
    if (diff.removal && appliedIds.has(diff.removal.id)) {
      planTaxonomyRemoval({ params, diff, plan })
    }
  }
}
