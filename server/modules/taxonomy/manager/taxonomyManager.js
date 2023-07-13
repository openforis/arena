import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

import { ExtraPropDef } from '@core/survey/extraPropDef'
import { validateExtraPropDef } from '@core/survey/extraPropDefValidator'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Taxon from '@core/survey/taxon'
import * as Validation from '@core/validation/validation'

import { db } from '@server/db/db'

import {
  publishSurveySchemaTableProps,
  markSurveyDraft,
} from '@server/modules/survey/repository/surveySchemaRepositoryUtils'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'

import * as TaxonomyRepository from '../repository/taxonomyRepository'
import * as TaxonomyValidator from '../taxonomyValidator'

/**.
 * ====== CREATE
 *
 * @param root0
 * @param root0.user
 * @param root0.surveyId
 * @param root0.taxonomy
 * @param root0.addLogs
 * @param root0.system
 * @param root0.backup
 * @param client
 */
export const insertTaxonomy = async (
  { user, surveyId, taxonomy, addLogs = true, system = false, backup = false },
  client = db
) =>
  client.tx(async (t) => {
    const [taxonomyInserted] = await Promise.all([
      TaxonomyRepository.insertTaxonomy({ surveyId, taxonomy, backup }, t),
      ...(addLogs
        ? [ActivityLogRepository.insert(user, surveyId, ActivityLog.type.taxonomyCreate, taxonomy, system, t)]
        : []),
    ])
    return validateTaxonomy(surveyId, [], taxonomyInserted, true, t)
  })

export const insertTaxa = async ({ user, surveyId, taxa, addLogs = true, backup = false, client = db }) =>
  client.tx(async (t) =>
    Promise.all([
      TaxonomyRepository.insertTaxa({ surveyId, taxa, backup, client: t }),
      ...(addLogs
        ? [
            ActivityLogRepository.insertMany(
              user,
              surveyId,
              taxa.map((taxon) => ActivityLog.newActivity(ActivityLog.type.taxonInsert, taxon, true)),
              t
            ),
          ]
        : []),
    ])
  )

/**.
 * ====== READ
 *
 * @param root0
 * @param root0.surveyId
 * @param root0.draft
 * @param root0.validate
 * @param root0.backup
 * @param root0.limit
 * @param root0.offset
 * @param root0.search
 * @param client
 */
export const fetchTaxonomiesBySurveyId = async (
  { surveyId, draft = false, validate = false, backup = false, limit = null, offset = 0, search = null },
  client = db
) => {
  const taxonomies = await TaxonomyRepository.fetchTaxonomiesBySurveyId(
    { surveyId, draft, backup, limit, offset, search },
    client
  )

  return validate
    ? Promise.all(taxonomies.map(async (taxonomy) => validateTaxonomy(surveyId, taxonomies, taxonomy, draft, client)))
    : taxonomies
}

export const { countTaxonomiesBySurveyId, countTaxaByTaxonomyUuid } = TaxonomyRepository

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
    return validateTaxonomy(surveyId, taxonomies, taxonomy, draft, client)
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
) =>
  includeUnknownUnlistedItems(
    surveyId,
    taxonomyUuid,
    await TaxonomyRepository.findTaxaByVernacularName(surveyId, taxonomyUuid, filterValue, draft, client),
    includeUnlUnk,
    draft
  )

export const { fetchTaxonByUuid, fetchTaxonByCode, fetchTaxonVernacularNameByUuid, fetchTaxaWithVernacularNames } =
  TaxonomyRepository

export const fetchTaxaWithVernacularNamesStream = async (surveyId, taxonomyUuid, draft) => {
  const taxonomy = await fetchTaxonomyByUuid(surveyId, taxonomyUuid, draft)
  const vernacularLangCodes = Taxonomy.getVernacularLanguageCodes(taxonomy)
  const extraPropsDefs = Taxonomy.getExtraPropsDefs(taxonomy)
  return {
    taxonomy,
    taxaStream: TaxonomyRepository.fetchTaxaWithVernacularNamesStream({
      surveyId,
      taxonomyUuid,
      vernacularLangCodes,
      extraPropsDefs,
      draft,
    }),
  }
}

// ====== UPDATE

export const publishTaxonomiesProps = async (surveyId, client = db) => {
  await publishSurveySchemaTableProps(surveyId, 'taxonomy', client)
  await publishSurveySchemaTableProps(surveyId, 'taxon', client)
  await publishSurveySchemaTableProps(surveyId, 'taxon_vernacular_name', client)
}

export const updateTaxonomyProp = async (user, surveyId, taxonomyUuid, key, value, system = false, client = db) =>
  client.tx(
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

export const updateTaxonAndVernacularNames = async (user, surveyId, taxon, client = db) =>
  client.tx(async (t) =>
    Promise.all([
      TaxonomyRepository.updateTaxonAndVernacularNames(surveyId, taxon, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.taxonUpdate, taxon, true, t),
    ])
  )

export const updateTaxa = async (user, surveyId, taxa, client = db) =>
  client.tx(async (t) =>
    Promise.all([
      TaxonomyRepository.updateTaxa(surveyId, taxa, t),
      ActivityLogRepository.insertMany(
        user,
        surveyId,
        taxa.map((taxon) => ActivityLog.newActivity(ActivityLog.type.taxonUpdate, taxon, true)),
        t
      ),
    ])
  )

const _updateTaxaExtraDefProp = async ({ surveyId, taxonomyUuid, propName, extraPropDef, deleted }, t) => {
  const taxa = await TaxonomyRepository.fetchTaxa({ surveyId, taxonomyUuid, draft: true }, t)
  if (taxa.length === 0) return

  const taxaUpdated = []
  taxa.forEach((taxon) => {
    if (R.isNil(Taxon.getExtraProp(propName)(taxon))) return

    const taxonUpdated = deleted
      ? Taxon.dissocExtraProp(propName)(taxon)
      : Taxon.renameExtraProp({ nameOld: propName, nameNew: ExtraPropDef.getName(extraPropDef) })(taxon)

    taxaUpdated.push(taxonUpdated)
  })
  if (taxaUpdated.length > 0) {
    await TaxonomyRepository.updateTaxaProps({ surveyId, taxa: taxaUpdated }, t)
  }
}

export const updateTaxonomyExtraPropDef = async (
  { user, surveyId, taxonomyUuid, propName, extraPropDef = null, deleted = false },
  client = db
) =>
  client.tx(async (t) => {
    const taxonomy = await TaxonomyRepository.fetchTaxonomyByUuid(surveyId, taxonomyUuid, true, t)

    // validate new item extra def
    let extraPropDefsArrayUpdated = [...Taxonomy.getExtraPropsDefsArray(taxonomy)]
    // remove old item
    extraPropDefsArrayUpdated = extraPropDefsArrayUpdated.filter((def) => ExtraPropDef.getName(def) !== propName)

    if (!deleted) {
      // add new extra def item
      extraPropDefsArrayUpdated.push(extraPropDef)

      const validation = await validateExtraPropDef({
        extraPropDef,
        extraPropDefsArray: extraPropDefsArrayUpdated,
      })
      if (!Validation.isValid(validation)) {
        throw new Error('Invalid taxonomy item extra def')
      }
    }

    // update category items
    if (deleted || propName !== ExtraPropDef.getName(extraPropDef)) {
      await _updateTaxaExtraDefProp({ surveyId, taxonomyUuid, propName, extraPropDef, deleted }, t)
    }

    // prepare extraPropDefs for storage
    // - remove unnecessary information (uuid, name)
    // - index stored object by extra def name
    const extraPropDefsToStore = extraPropDefsArrayUpdated.reduce(
      (acc, item) => ({
        ...acc,
        [ExtraPropDef.getName(item)]: ExtraPropDef.newItem({
          dataType: ExtraPropDef.getDataType(item),
        }),
      }),
      {}
    )

    return updateTaxonomyProp(
      user,
      surveyId,
      taxonomyUuid,
      Taxonomy.keysProps.extraPropsDefs,
      extraPropDefsToStore,
      false,
      t
    )
  })

// ============== DELETE

export const deleteTaxonomy = async ({ user, surveyId, taxonomyUuid, onlyIfEmpty = false }, client = db) =>
  client.tx(async (t) => {
    if (onlyIfEmpty) {
      const draft = true
      const validate = false
      const taxonomyOld = await fetchTaxonomyByUuid(surveyId, taxonomyUuid, draft, validate, t)
      const taxaCount = await TaxonomyRepository.countTaxaByTaxonomyUuid(surveyId, taxonomyUuid, draft, t)
      const taxonomyEmpty = Taxonomy.isEmpty(taxonomyOld) && taxaCount === 0
      if (!taxonomyEmpty) return false
    }
    const taxonomy = await TaxonomyRepository.deleteTaxonomy(surveyId, taxonomyUuid, t)
    const logContent = {
      [ActivityLog.keysContent.uuid]: taxonomyUuid,
      [ActivityLog.keysContent.taxonomyName]: Taxonomy.getName(taxonomy),
    }
    await Promise.all([
      markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.taxonomyDelete, logContent, false, t),
    ])
    return true
  })

export const deleteDraftTaxaByTaxonomyUuid = async (user, surveyId, taxonomyUuid, t) =>
  Promise.all([
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
