import path from 'path'

import * as R from 'ramda'

import * as Taxonomy from '@core/survey/taxonomy'
import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'

import * as TaxonomyManager from '@server/modules/taxonomy/manager/taxonomyManager'
import TaxonomyImportJob from '@server/modules/taxonomy/service/taxonomyImportJob'

export const fetchTaxonomyByName = async (surveyId, name, draft) => {
  const taxonomies = await TaxonomyManager.fetchTaxonomiesBySurveyId(surveyId, draft)
  return R.find(taxonomy => Taxonomy.getName(taxonomy) === name)(taxonomies)
}

export const fetchTaxonomyUuidByName = async (surveyId, name, draft) => {
  const taxonomy = await fetchTaxonomyByName(surveyId, name, draft)
  return Taxonomy.getUuid(taxonomy)
}

export const fetchTaxonByCode = async (surveyId, taxonomyUuid, code, draft) => {
  const taxa = await TaxonomyManager.fetchTaxaWithVernacularNames(surveyId, taxonomyUuid, draft)
  return R.find(taxon => Taxon.getCode(taxon) === code)(taxa)
}

export const addVernacularNameToTaxon = async (user, surveyId, taxonomyName, taxonCode, lang, name) => {
  const taxonomyUuid = await fetchTaxonomyUuidByName(surveyId, taxonomyName, true)

  // load taxon
  const taxon = await fetchTaxonByCode(surveyId, taxonomyUuid, taxonCode, true)

  // create new vernacular name or updated existing one
  const vernacularNameNew = TaxonVernacularName.newTaxonVernacularName(lang, name)

  const vernacularNamesOld = Taxon.getVernacularNamesByLang(lang)(taxon)
  const vernacularNamesNew = TaxonVernacularName.mergeVernacularNames([vernacularNameNew])(vernacularNamesOld)

  // update taxon
  const taxonUpdated = await Taxon.assocVernacularNames(lang, vernacularNamesNew)(taxon)
  await TaxonomyManager.updateTaxon(user, surveyId, taxonUpdated)

  return { vernacularNamesNew, vernacularNamesOld }
}

export const getTaxonVernacularNames = lang => R.pipe(Taxon.getVernacularNamesByLang(lang), R.map(TaxonVernacularName.getName), names => names.sort())

export const getTaxonSingleVernacularName = lang => R.pipe(getTaxonVernacularNames(lang), R.head)

// import
export const importFile = async (user, surveyId, taxonomyName, importFileName) => {
  // fetch or create new taxonomy
  const taxonomies = await TaxonomyManager.fetchTaxonomiesBySurveyId(surveyId, true)
  const taxonomyExisting = R.find(taxonomy => Taxonomy.getName(taxonomy) === taxonomyName)(taxonomies)
  let taxonomy = null
  if (taxonomyExisting) {
    taxonomy = taxonomyExisting
  } else {
    taxonomy = Taxonomy.newTaxonomy({ [Taxonomy.keysProps.name]: taxonomyName })
    await TaxonomyManager.insertTaxonomy(user, surveyId, taxonomy)
  }
  const taxonomyUuid = Taxonomy.getUuid(taxonomy)
  const job = new TaxonomyImportJob({
    user,
    surveyId,
    taxonomyUuid,
    filePath: path.join(__dirname, 'importJobFiles', importFileName),
  });
  await job.start()
  
  return { job, taxonomyUuid }
}
