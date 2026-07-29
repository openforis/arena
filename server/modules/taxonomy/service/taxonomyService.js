import { ExportFileNameGenerator } from '@common/dataExport/exportFileNameGenerator'

import * as Survey from '@core/survey/survey'
import * as Taxonomy from '@core/survey/taxonomy'
import { DataImportTemplateTypes } from '@core/dataImport'
import * as User from '@core/user/user'
import * as NumberUtils from '@core/numberUtils'
import * as Authorizer from '@core/auth/authorizer'

import * as FlatDataWriter from '@server/utils/file/flatDataWriter'
import * as DbUtils from '@server/db/dbUtils'
import * as JobManager from '@server/job/jobManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as Response from '@server/utils/response'
import UnauthorizedError from '@server/utils/unauthorizedError'

import * as TaxonomyManager from '../manager/taxonomyManager'
import { TaxonomyImportTemplateGenerator } from '../manager/taxonomyImportTemplateGenerator'
import TaxonomyImportJob from './taxonomyImportJob'

export const {
  // Create
  insertTaxonomy,

  // Read
  fetchTaxonomyByUuid,
  fetchTaxonomiesBySurveyId,
  countTaxonomiesBySurveyId,
  countTaxaBySurveyId,
  countTaxaByTaxonomyUuid,
  findTaxaByCode,
  findTaxaByScientificName,
  findTaxaByCodeOrScientificName,
  findTaxaByVernacularName,
  fetchTaxaWithVernacularNames,
  fetchTaxonByUuid,
  fetchTaxonVernacularNameByUuid,

  // Update
  updateTaxonomyProp,
  updateTaxonomyExtraPropDef,
  // Delete

  deleteTaxonomy,
} = TaxonomyManager

/**
 * Validates that the given value is a positive integer survey id.
 * @param {!object} params - Parameters object.
 * @param {number|string} params.surveyId - The value to validate.
 * @param {!string} params.paramName - The name of the parameter, used in the error message.
 * @returns {number} The survey id, converted to a number.
 * @throws {Error} If the value is not a positive integer.
 */
const _validateSurveyId = ({ surveyId, paramName }) => {
  if (!NumberUtils.isInteger(surveyId) || Number(surveyId) <= 0) {
    throw new Error(`${paramName} must be a positive integer`)
  }
  return Number(surveyId)
}

/**
 * Clones a taxonomy from another survey into the given survey, after validating the survey ids
 * and checking that the user is allowed to view the source survey.
 * @param {!object} params - Parameters object.
 * @param {!object} params.user - The user performing this operation.
 * @param {!number} params.sourceSurveyId - The id of the survey the taxonomy is cloned from.
 * @param {!string} params.sourceTaxonomyUuid - The uuid of the taxonomy to clone.
 * @param {!number} params.targetSurveyId - The id of the survey the taxonomy is cloned into.
 * @returns {Promise<Taxonomy>} The cloned taxonomy.
 * @throws {UnauthorizedError} If the user is not allowed to view the source survey.
 */
export const cloneTaxonomyFromSurvey = async ({ user, sourceSurveyId, sourceTaxonomyUuid, targetSurveyId }) => {
  const sourceSurveyIdValidated = _validateSurveyId({ surveyId: sourceSurveyId, paramName: 'sourceSurveyId' })
  const targetSurveyIdValidated = _validateSurveyId({ surveyId: targetSurveyId, paramName: 'targetSurveyId' })

  const sourceSurvey = await SurveyManager.fetchSurveyById({ surveyId: sourceSurveyIdValidated })
  const sourceSurveyInfo = Survey.getSurveyInfo(sourceSurvey)
  if (!Authorizer.canViewSurvey(user, sourceSurveyInfo)) {
    throw new UnauthorizedError(User.getName(user))
  }

  return TaxonomyManager.cloneTaxonomyFromSurvey({
    user,
    sourceSurveyId: sourceSurveyIdValidated,
    sourceTaxonomyUuid,
    targetSurveyId: targetSurveyIdValidated,
  })
}

export const exportTaxa = async ({ surveyId, taxonomyUuid, outputStream, fileFormat, draft = false }) => {
  const { taxonomy, taxaStream: taxaQueryStream } = await TaxonomyManager.fetchTaxaWithVernacularNamesStream(
    surveyId,
    taxonomyUuid,
    draft
  )
  const vernacularLangCodes = Taxonomy.getVernacularLanguageCodes(taxonomy)
  const extraPropKeys = Taxonomy.getExtraPropKeys(taxonomy)

  const fields = ['code', 'family', 'genus', 'scientific_name', ...vernacularLangCodes, ...extraPropKeys]

  await DbUtils.stream({
    queryStream: taxaQueryStream,
    processor: async (dbStream) =>
      FlatDataWriter.writeItemsStreamToStream({ stream: dbStream, outputStream, fields, fileFormat }),
  })
}

export const exportTaxaImportTemplate = async ({ surveyId, taxonomyUuid, draft, res, fileFormat, templateType }) => {
  const [survey, taxonomy] = await Promise.all([
    SurveyManager.fetchSurveyById({ surveyId, draft }),
    TaxonomyManager.fetchTaxonomyByUuid(surveyId, taxonomyUuid, draft),
  ])
  const templateData = TaxonomyImportTemplateGenerator.generateTemplate({ taxonomy, templateType })
  const fileTypeSuffix = templateType === DataImportTemplateTypes.generic ? 'Generic' : ''
  const fileName = ExportFileNameGenerator.generate({
    survey,
    fileType: `TaxonomyImport${fileTypeSuffix}`,
    itemName: Taxonomy.getName(taxonomy),
    fileFormat,
  })
  Response.setContentTypeFile({ res, fileName, fileFormat })
  await FlatDataWriter.writeItemsToStream({ outputStream: res, fileFormat, items: templateData })
}

export const importTaxonomy = ({ user, surveyId, taxonomyUuid, filePath, fileFormat }) => {
  const job = new TaxonomyImportJob({
    user,
    surveyId,
    taxonomyUuid,
    filePath,
    fileFormat,
  })

  JobManager.enqueueJob(job)

  return job
}
