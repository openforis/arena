import * as FlatDataWriter from '@server/utils/file/flatDataWriter'
import * as DbUtils from '@server/db/dbUtils'

import * as Taxonomy from '@core/survey/taxonomy'

import * as JobManager from '@server/job/jobManager'
import * as TaxonomyManager from '../manager/taxonomyManager'
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
