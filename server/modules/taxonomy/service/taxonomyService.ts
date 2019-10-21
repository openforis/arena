import * as R from 'ramda';
import fastcsv from 'fast-csv';
import Taxonomy from '../../../../core/survey/taxonomy';
import Taxon from '../../../../core/survey/taxon';
import TaxonomyManager from '../manager/taxonomyManager';
import JobManager from '../../../job/jobManager';
import TaxonomyImportJob from './taxonomyImportJob';

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
  const taxa = await TaxonomyManager.fetchTaxaWithVernacularNames(surveyId, taxonomyUuid, draft)

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

export default {
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
};
