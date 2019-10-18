const CSVWriter = require('../../../utils/file/csvWriter')
const db = require('../../../db/db')

const Taxonomy = require('../../../../core/survey/taxonomy')

const TaxonomyManager = require('../manager/taxonomyManager')
const JobManager = require('../../../job/jobManager')
const TaxonomyImportJob = require('./taxonomyImportJob')

const exportTaxa = async (surveyId, taxonomyUuid, output, draft = false) => {
  const { taxonomy, taxa: taxaStream } = await TaxonomyManager.fetchTaxaWithVernacularNames(surveyId, taxonomyUuid, draft, 0, null, true)
  const vernacularLangCodes = Taxonomy.getVernacularLanguageCodes(taxonomy)

  const headers = [
    'code',
    'family',
    'genus',
    'scientific_name',
    ...vernacularLangCodes
  ]

  await db.stream(
    taxaStream,
    stream => {
      stream.pipe(CSVWriter.transformToStream(output, headers))
    })
}

const importTaxonomy = (user, surveyId, taxonomyUuid, filePath) => {
  const job = new TaxonomyImportJob({
    user,
    surveyId,
    taxonomyUuid,
    filePath
  })

  JobManager.executeJobThread(job)

  return job
}

module.exports = {
  insertTaxonomy: TaxonomyManager.insertTaxonomy,

  fetchTaxonomyByUuid: TaxonomyManager.fetchTaxonomyByUuid,
  fetchTaxonomiesBySurveyId: TaxonomyManager.fetchTaxonomiesBySurveyId,

  countTaxaByTaxonomyUuid: TaxonomyManager.countTaxaByTaxonomyUuid,
  findTaxaByCode: TaxonomyManager.findTaxaByCode,
  findTaxaByScientificName: TaxonomyManager.findTaxaByScientificName,
  findTaxaByCodeOrScientificName: TaxonomyManager.findTaxaByCodeOrScientificName,
  findTaxaByVernacularName: TaxonomyManager.findTaxaByVernacularName,

  fetchTaxaWithVernacularNames: TaxonomyManager.fetchTaxaWithVernacularNames,
  fetchTaxonByUuid: TaxonomyManager.fetchTaxonByUuid,
  fetchTaxonVernacularNameByUuid: TaxonomyManager.fetchTaxonVernacularNameByUuid,

  // update
  updateTaxonomyProp: TaxonomyManager.updateTaxonomyProp,

  // delete
  deleteTaxonomy: TaxonomyManager.deleteTaxonomy,

  exportTaxa,
  importTaxonomy,
}