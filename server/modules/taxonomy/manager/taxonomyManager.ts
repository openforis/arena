import * as R from 'ramda';
import db from '../../../db/db';
import { publishSurveySchemaTableProps, markSurveyDraft } from '../../survey/repository/surveySchemaRepositoryUtils';
import Taxonomy from '../../../../core/survey/taxonomy';
import Taxon from '../../../../core/survey/taxon';
import TaxonomyRepository from '../repository/taxonomyRepository';
import TaxonomyValidator from '../taxonomyValidator';
import ActivityLog from '../../activityLog/activityLogger';

/**
 * ====== CREATE
 */
const insertTaxonomy = async (user, surveyId, taxonomy, client: any = db) =>
  await client.tx(async t => {
    const [taxonomyInserted] = await Promise.all([
      TaxonomyRepository.insertTaxonomy(surveyId, taxonomy),
      ActivityLog.log(user, surveyId, ActivityLog.type.taxonomyCreate, taxonomy, t)
    ])
    return await validateTaxonomy(surveyId, [], taxonomyInserted)
  })

const insertTaxa = async (surveyId, taxa, user, client: any = db) =>
  await client.tx(async t => await Promise.all([
    TaxonomyRepository.insertTaxa(surveyId, taxa, t),
    ActivityLog.logMany(
      user,
      surveyId,
      taxa.map(taxon => ({
        type: ActivityLog.type.taxonInsert,
        params: taxon,
      })),
      t
    )
  ]))

/**
 * ====== READ
 */
const fetchTaxonomiesBySurveyId = async (surveyId, draft = false, validate = false, client: any = db) => {
  const taxonomies = await TaxonomyRepository.fetchTaxonomiesBySurveyId(surveyId, draft, client)

  return validate
    ? await Promise.all(
      taxonomies.map(async taxonomy => await validateTaxonomy(surveyId, taxonomies, taxonomy, client))
    )
    : taxonomies
}

const validateTaxonomy = async (surveyId, taxonomies = [], taxonomy, client: any = db) => {
  const taxaCount = await TaxonomyRepository.countTaxaByTaxonomyUuid(surveyId, Taxonomy.getUuid(taxonomy), client)

  return {
    ...taxonomy,
    validation: await TaxonomyValidator.validateTaxonomy(taxonomies, taxonomy, taxaCount)
  }
}

const fetchTaxonomyByUuid = async (surveyId, taxonomyUuid, draft = false, validate = false, client: any = db) => {
  const taxonomy = await TaxonomyRepository.fetchTaxonomyByUuid(surveyId, taxonomyUuid, draft, client)

  if (validate) {
    const taxonomies = await TaxonomyRepository.fetchTaxonomiesBySurveyId(surveyId, draft, client)
    return await validateTaxonomy(surveyId, taxonomies, taxonomy, client)
  } else {
    return taxonomy
  }
}

const includeUnknownUnlistedItems = async (surveyId, taxonomyUuid, taxa, includeUnlUnk, draft) =>
  R.isEmpty(taxa) && includeUnlUnk
    ? [
      await TaxonomyRepository.fetchTaxonByCode(surveyId, taxonomyUuid, Taxon.unknownCode, draft),
      await TaxonomyRepository.fetchTaxonByCode(surveyId, taxonomyUuid, Taxon.unlistedCode, draft),
    ]
    : taxa

const findTaxaByCode = async (surveyId, taxonomyUuid, filterValue, draft = false, includeUnlUnk = false, client: any = db) =>
  includeUnknownUnlistedItems(
    surveyId,
    taxonomyUuid,
    await TaxonomyRepository.findTaxaByCode(surveyId, taxonomyUuid, filterValue, draft, client),
    includeUnlUnk,
    draft
  )

const findTaxaByScientificName = async (surveyId, taxonomyUuid, filterValue, draft = false, includeUnlUnk = false, client: any = db) =>
  includeUnknownUnlistedItems(
    surveyId,
    taxonomyUuid,
    await TaxonomyRepository.findTaxaByScientificName(surveyId, taxonomyUuid, filterValue, draft, client),
    includeUnlUnk,
    draft
  )

const findTaxaByCodeOrScientificName = async (surveyId, taxonomyUuid, filterValue, draft = false, includeUnlUnk = false, client: any = db) =>
  includeUnknownUnlistedItems(
    surveyId,
    taxonomyUuid,
    await TaxonomyRepository.findTaxaByCodeOrScientificName(surveyId, taxonomyUuid, filterValue, draft, client),
    includeUnlUnk,
    draft
  )

const findTaxaByVernacularName = async (surveyId, taxonomyUuid, filterValue, draft = false, includeUnlUnk = false, client: any = db) => {
  const taxaDb = await TaxonomyRepository.findTaxaByVernacularName(surveyId, taxonomyUuid, filterValue, draft, client)
  return includeUnknownUnlistedItems(surveyId, taxonomyUuid, taxaDb, includeUnlUnk, draft)
}

// ====== UPDATE

const publishTaxonomiesProps = async (surveyId, client: any = db) => {
  await publishSurveySchemaTableProps(surveyId, 'taxonomy', client)
  await publishSurveySchemaTableProps(surveyId, 'taxon', client)
  await publishSurveySchemaTableProps(surveyId, 'taxon_vernacular_name', client)
}

const updateTaxonomyProp = async (user, surveyId, taxonomyUuid, key, value, client: any = db) =>
  await client.tx(async t => (await Promise.all([
      TaxonomyRepository.updateTaxonomyProp(surveyId, taxonomyUuid, key, value, t),
      markSurveyDraft(surveyId, t),
      ActivityLog.log(user, surveyId, ActivityLog.type.taxonomyPropUpdate, { taxonomyUuid, key, value }, t)
    ]))[0]
  )

// ============== DELETE

const deleteTaxonomy = async (user, surveyId, taxonomyUuid, client: any = db) =>
  await client.tx(async t => await Promise.all([
    TaxonomyRepository.deleteTaxonomy(surveyId, taxonomyUuid, t),
    markSurveyDraft(surveyId, t),
    ActivityLog.log(user, surveyId, ActivityLog.type.taxonomyDelete, { taxonomyUuid }, t)
  ]))

const deleteDraftTaxaByTaxonomyUuid = async (user, surveyId, taxonomyUuid, client: any = db) =>
  await client.tx(async t => await Promise.all([
    TaxonomyRepository.deleteDraftTaxaByTaxonomyUuid(surveyId, taxonomyUuid, t),
    ActivityLog.log(user, surveyId, ActivityLog.type.taxonomyTaxaDelete, { taxonomyUuid }, t)
  ]))

export default {
  //CREATE
  insertTaxonomy,
  insertTaxa,

  //READ
  fetchTaxonomyByUuid,
  fetchTaxonomiesBySurveyId,
  countTaxaByTaxonomyUuid: TaxonomyRepository.countTaxaByTaxonomyUuid,
  findTaxaByCode,
  findTaxaByScientificName,
  findTaxaByCodeOrScientificName,
  findTaxaByVernacularName,
  fetchTaxonByUuid: TaxonomyRepository.fetchTaxonByUuid,
  fetchTaxonByCode: TaxonomyRepository.fetchTaxonByCode,
  fetchTaxonVernacularNameByUuid: TaxonomyRepository.fetchTaxonVernacularNameByUuid,
  fetchTaxaWithVernacularNames: TaxonomyRepository.fetchTaxaWithVernacularNames,

  //UPDATE
  publishTaxonomiesProps,
  updateTaxonomyProp,

  //DELETE
  deleteTaxonomy,
  deleteDraftTaxaByTaxonomyUuid,
};
