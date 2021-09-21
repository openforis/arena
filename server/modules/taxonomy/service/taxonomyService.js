import * as CSVWriter from '@server/utils/file/csvWriter'
import { db } from '@server/db/db'

import * as Taxonomy from '@core/survey/taxonomy'

import * as JobManager from '@server/job/jobManager'
import * as TaxonomyManager from '../manager/taxonomyManager'
import TaxonomyImportJob from './taxonomyImportJob'

export const exportTaxa = async (surveyId, taxonomyUuid, output, draft = false) => {
  const { taxonomy, taxaStream } = await TaxonomyManager.fetchTaxaWithVernacularNamesStream(
    surveyId,
    taxonomyUuid,
    draft
  )
  const vernacularLangCodes = Taxonomy.getVernacularLanguageCodes(taxonomy)
  const extraPropKeys = Taxonomy.getExtraPropKeys(taxonomy)

  const headers = ['code', 'family', 'genus', 'scientific_name', ...vernacularLangCodes, ...extraPropKeys]

  await db.stream(taxaStream, (stream) => {
    stream.pipe(CSVWriter.transformToStream(output, headers))
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

export const insertTaxonomy = TaxonomyManager.insertTaxonomy

export const fetchTaxonomyByUuid = TaxonomyManager.fetchTaxonomyByUuid
export const fetchTaxonomiesBySurveyId = TaxonomyManager.fetchTaxonomiesBySurveyId

export const countTaxonomiesBySurveyId = TaxonomyManager.countTaxonomiesBySurveyId
export const countTaxaByTaxonomyUuid = TaxonomyManager.countTaxaByTaxonomyUuid
export const findTaxaByCode = TaxonomyManager.findTaxaByCode
export const findTaxaByScientificName = TaxonomyManager.findTaxaByScientificName
export const findTaxaByCodeOrScientificName = TaxonomyManager.findTaxaByCodeOrScientificName
export const findTaxaByVernacularName = TaxonomyManager.findTaxaByVernacularName

export const fetchTaxaWithVernacularNames = TaxonomyManager.fetchTaxaWithVernacularNames
export const fetchTaxonByUuid = TaxonomyManager.fetchTaxonByUuid
export const fetchTaxonVernacularNameByUuid = TaxonomyManager.fetchTaxonVernacularNameByUuid

// Update
export const updateTaxonomyProp = TaxonomyManager.updateTaxonomyProp

// Delete
export const deleteTaxonomy = TaxonomyManager.deleteTaxonomy
