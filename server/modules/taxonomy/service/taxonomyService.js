import * as CSVWriter from '@server/utils/file/csvWriter'
import { db } from '@server/db/db'

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

export const exportTaxa = async (surveyId, taxonomyUuid, output, draft = false) => {
  const { taxonomy, taxaStream } = await TaxonomyManager.fetchTaxaWithVernacularNamesStream(
    surveyId,
    taxonomyUuid,
    draft
  )
  const vernacularLangCodes = Taxonomy.getVernacularLanguageCodes(taxonomy)
  const extraPropKeys = Taxonomy.getExtraPropKeys(taxonomy)

  const headers = ['code', 'family', 'genus', 'scientific_name', ...vernacularLangCodes, ...extraPropKeys]

  await db.stream(taxaStream, (dbStream) => {
    const csvTransform = CSVWriter.transformJsonToCsv({ fields: headers })
    dbStream.pipe(csvTransform).pipe(output)
  })
}

export const importTaxonomy = (user, surveyId, taxonomyUuid, filePath) => {
  const job = new TaxonomyImportJob({
    user,
    surveyId,
    taxonomyUuid,
    filePath,
  })

  JobManager.executeJobThread(job)

  return job
}
