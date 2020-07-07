import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as Taxonomy from '@core/survey/taxonomy'
import * as Taxon from '@core/survey/taxon'
import * as ObjectUtils from '@core/objectUtils'

import { db } from '@server/db/db'

import {
  publishSurveySchemaTableProps,
  markSurveyDraft,
} from '@server/modules/survey/repository/surveySchemaRepositoryUtils'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'

import * as TaxonomyRepository from '../repository/taxonomyRepository'
import * as TaxonomyValidator from '../taxonomyValidator'

/**
 * ====== CREATE
 */
export const insertTaxonomy = async (user, surveyId, taxonomy, system = false, client = db) =>
  await client.tx(async (t) => {
    const [taxonomyInserted] = await Promise.all([
      TaxonomyRepository.insertTaxonomy(surveyId, taxonomy),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.taxonomyCreate, taxonomy, system, t),
    ])
    return await validateTaxonomy(surveyId, [], taxonomyInserted, true, t)
  })

export const insertTaxa = async (user, surveyId, taxa, client = db) =>
  await client.tx(
    async (t) =>
      await Promise.all([
        TaxonomyRepository.insertTaxa(surveyId, taxa, t),
        ActivityLogRepository.insertMany(
          user,
          surveyId,
          taxa.map((taxon) => ActivityLog.newActivity(ActivityLog.type.taxonInsert, taxon, true)),
          t
        ),
      ])
  )

/**
 * ====== READ
 */
export const fetchTaxonomiesBySurveyId = async (
  { surveyId, draft = false, validate = false, limit = null, offset = 0 },
  client = db
) => {
  const taxonomies = await TaxonomyRepository.fetchTaxonomiesBySurveyId({ surveyId, draft, limit, offset }, client)
  
  return validate
    ? await Promise.all(
        taxonomies.map(async (taxonomy) => await validateTaxonomy(surveyId, taxonomies, taxonomy, draft, client))
      )
    : taxonomies
}

export const countTaxonomiesBySurveyId = TaxonomyRepository.countTaxonomiesBySurveyId

export const countTaxaByTaxonomyUuid = TaxonomyRepository.countTaxaByTaxonomyUuid

const validateTaxonomy = async (surveyId, taxonomies, taxonomy, draft, client = db) => {
  const taxaCount = await TaxonomyRepository.countTaxaByTaxonomyUuid(
    surveyId,
    Taxonomy.getUuid(taxonomy),
    draft,
    client
  )

  return {
    ...taxonomy,
    validation: await TaxonomyValidator.validateTaxonomy(taxonomies || [], taxonomy, taxaCount),
  }
}

export const fetchTaxonomyByUuid = async (surveyId, taxonomyUuid, draft = false, validate = false, client = db) => {
  const taxonomy = await TaxonomyRepository.fetchTaxonomyByUuid(surveyId, taxonomyUuid, draft, client)

  if (validate) {
    const taxonomies = await TaxonomyRepository.fetchTaxonomiesBySurveyId({ surveyId, draft }, client)
    return await validateTaxonomy(surveyId, taxonomies, taxonomy, draft, client)
  }

  return taxonomy
}

const includeUnknownUnlistedItems = async (surveyId, taxonomyUuid, taxa, includeUnlUnk, draft) =>
  R.isEmpty(taxa) && includeUnlUnk
    ? [
        await TaxonomyRepository.fetchTaxonByCode(surveyId, taxonomyUuid, Taxon.unknownCode, draft),
        await TaxonomyRepository.fetchTaxonByCode(surveyId, taxonomyUuid, Taxon.unlistedCode, draft),
      ]
    : taxa

export const findTaxaByCode = async (
  surveyId,
  taxonomyUuid,
  filterValue,
  draft = false,
  includeUnlUnk = false,
  client = db
) =>
  includeUnknownUnlistedItems(
    surveyId,
    taxonomyUuid,
    await TaxonomyRepository.findTaxaByCode(surveyId, taxonomyUuid, filterValue, draft, client),
    includeUnlUnk,
    draft
  )

export const findTaxaByScientificName = async (
  surveyId,
  taxonomyUuid,
  filterValue,
  draft = false,
  includeUnlUnk = false,
  client = db
) =>
  includeUnknownUnlistedItems(
    surveyId,
    taxonomyUuid,
    await TaxonomyRepository.findTaxaByScientificName(surveyId, taxonomyUuid, filterValue, draft, client),
    includeUnlUnk,
    draft
  )

export const findTaxaByCodeOrScientificName = async (
  surveyId,
  taxonomyUuid,
  filterValue,
  draft = false,
  includeUnlUnk = false,
  client = db
) =>
  includeUnknownUnlistedItems(
    surveyId,
    taxonomyUuid,
    await TaxonomyRepository.findTaxaByCodeOrScientificName(surveyId, taxonomyUuid, filterValue, draft, client),
    includeUnlUnk,
    draft
  )

export const findTaxaByVernacularName = async (
  surveyId,
  taxonomyUuid,
  filterValue,
  draft = false,
  includeUnlUnk = false,
  client = db
) => {
  const taxaDb = await TaxonomyRepository.findTaxaByVernacularName(surveyId, taxonomyUuid, filterValue, draft, client)
  return includeUnknownUnlistedItems(surveyId, taxonomyUuid, taxaDb, includeUnlUnk, draft)
}

export const fetchTaxonByUuid = TaxonomyRepository.fetchTaxonByUuid
export const fetchTaxonByCode = TaxonomyRepository.fetchTaxonByCode
export const fetchTaxonVernacularNameByUuid = TaxonomyRepository.fetchTaxonVernacularNameByUuid
export const fetchTaxaWithVernacularNames = TaxonomyRepository.fetchTaxaWithVernacularNames
export const fetchTaxonUuidAndVernacularNamesByCode = async (surveyId, taxonomyUuid, draft) => {
  const taxa = await TaxonomyRepository.fetchTaxaWithVernacularNames(surveyId, taxonomyUuid, draft)
  return ObjectUtils.toIndexedObj(taxa, `${Taxon.keys.props}.${Taxon.propKeys.code}`)
}

export const fetchTaxaWithVernacularNamesStream = async (surveyId, taxonomyUuid, draft) => {
  const taxonomy = await fetchTaxonomyByUuid(surveyId, taxonomyUuid, draft)
  const vernacularLangCodes = Taxonomy.getVernacularLanguageCodes(taxonomy)
  return {
    taxonomy,
    taxaStream: TaxonomyRepository.fetchTaxaWithVernacularNamesStream(
      surveyId,
      taxonomyUuid,
      vernacularLangCodes,
      draft
    ),
  }
}

// ====== UPDATE

export const publishTaxonomiesProps = async (surveyId, client = db) => {
  await publishSurveySchemaTableProps(surveyId, 'taxonomy', client)
  await publishSurveySchemaTableProps(surveyId, 'taxon', client)
  await publishSurveySchemaTableProps(surveyId, 'taxon_vernacular_name', client)
}

export const updateTaxonomyProp = async (user, surveyId, taxonomyUuid, key, value, system = false, client = db) =>
  await client.tx(
    async (t) =>
      (
        await Promise.all([
          TaxonomyRepository.updateTaxonomyProp(surveyId, taxonomyUuid, key, value, t),
          markSurveyDraft(surveyId, t),
          ActivityLogRepository.insert(
            user,
            surveyId,
            ActivityLog.type.taxonomyPropUpdate,
            {
              [ActivityLog.keysContent.uuid]: taxonomyUuid,
              [ActivityLog.keysContent.key]: key,
              [ActivityLog.keysContent.value]: value,
            },
            system,
            t
          ),
        ])
      )[0]
  )

export const updateTaxon = async (user, surveyId, taxon, client = db) =>
  await client.tx(
    async (t) =>
      await Promise.all([
        TaxonomyRepository.updateTaxon(surveyId, taxon, t),
        ActivityLogRepository.insert(user, surveyId, ActivityLog.type.taxonUpdate, taxon, true, t),
      ])
  )

export const updateTaxa = async (user, surveyId, taxa, client = db) =>
  await client.tx(
    async (t) =>
      await Promise.all([
        TaxonomyRepository.updateTaxa(surveyId, taxa, t),
        ActivityLogRepository.insertMany(
          user,
          surveyId,
          taxa.map((taxon) => ActivityLog.newActivity(ActivityLog.type.taxonUpdate, taxon, true)),
          t
        ),
      ])
  )

// ============== DELETE

export const deleteTaxonomy = async (user, surveyId, taxonomyUuid, client = db) =>
  await client.tx(async (t) => {
    const taxonomy = await TaxonomyRepository.deleteTaxonomy(surveyId, taxonomyUuid, t)
    const logContent = {
      [ActivityLog.keysContent.uuid]: taxonomyUuid,
      [ActivityLog.keysContent.taxonomyName]: Taxonomy.getName(taxonomy),
    }
    await Promise.all([
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.taxonomyDelete, logContent, false, t),
    ])
  })

export const deleteDraftTaxaByTaxonomyUuid = async (user, surveyId, taxonomyUuid, t) =>
  await Promise.all([
    TaxonomyRepository.deleteDraftTaxaByTaxonomyUuid(surveyId, taxonomyUuid, t),
    ActivityLogRepository.insert(
      user,
      surveyId,
      ActivityLog.type.taxonomyTaxaDelete,
      { [ActivityLog.keysContent.uuid]: taxonomyUuid },
      true,
      t
    ),
  ])
