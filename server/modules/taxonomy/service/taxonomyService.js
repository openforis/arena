import { ExportFileNameGenerator } from '@common/dataExport/exportFileNameGenerator'

import * as Taxonomy from '@core/survey/taxonomy'
import { DataImportTemplateTypes } from '@core/dataImport'

import * as FlatDataWriter from '@server/utils/file/flatDataWriter'
import * as DbUtils from '@server/db/dbUtils'
import * as JobManager from '@server/job/jobManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as Response from '@server/utils/response'

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
