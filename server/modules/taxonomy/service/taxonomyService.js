const R = require('ramda')
const fastcsv = require('fast-csv')

const Taxonomy = require('../../../../common/survey/taxonomy')
const Taxon = require('../../../../common/survey/taxon')

const TaxonomyManager = require('../manager/taxonomyManager')
const JobManager = require('../../../job/jobManager')
const TaxonomyImportJob = require('./taxonomyImportJob')

const exportTaxa = async (surveyId, taxonomyUuid, output, draft = false) => {
  const taxonomy = await TaxonomyManager.fetchTaxonomyByUuid(surveyId, taxonomyUuid, draft)
  const vernacularLanguageCodes = Taxonomy.getVernacularLanguageCodes(taxonomy)

  const csvStream = fastcsv.format({ headers: true })
  csvStream.pipe(output)

  const fixedHeaders = [
    'code',
    'family',
    'genus',
    'scientific_name'
  ]
  //write headers
  csvStream.write(R.concat(fixedHeaders, vernacularLanguageCodes))

  //write taxa
  const taxa = await TaxonomyManager.fetchAllTaxa(surveyId, taxonomyUuid, draft)

  taxa.forEach(taxon => {
    csvStream.write(
      R.concat([
          Taxon.getCode(taxon),
          Taxon.getFamily(taxon),
          Taxon.getGenus(taxon),
          Taxon.getScientificName(taxon)
        ],
        vernacularLanguageCodes.map(
          langCode => Taxon.getVernacularName(langCode)(taxon)
        )
      ))
  })
  csvStream.end()
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

  fetchTaxonByUuid: TaxonomyManager.fetchTaxonByUuid,
  fetchTaxaByVernacularName: TaxonomyManager.fetchTaxaByVernacularName,
  fetchTaxaByPropLike: TaxonomyManager.fetchTaxaByPropLike,
  fetchAllTaxa: TaxonomyManager.fetchAllTaxa,
  countTaxaByTaxonomyUuid: TaxonomyManager.countTaxaByTaxonomyUuid,

  fetchTaxonVernacularNameByUuid: TaxonomyManager.fetchTaxonVernacularNameByUuid,

  // update
  updateTaxonomyProp: TaxonomyManager.updateTaxonomyProp,

  // delete
  deleteTaxonomy: TaxonomyManager.deleteTaxonomy,

  exportTaxa,
  importTaxonomy,
}