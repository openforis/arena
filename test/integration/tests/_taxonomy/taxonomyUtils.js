import path from 'path'

import * as R from 'ramda'

import * as Taxonomy from '@core/survey/taxonomy'
import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'

import * as TaxonomyManager from '@server/modules/taxonomy/manager/taxonomyManager'
import TaxonomyImportJob from '@server/modules/taxonomy/service/taxonomyImportJob'

// ==== READ (getters)
export const getTaxonVernacularNamesText = (lang) =>
  R.pipe(Taxon.getVernacularNamesByLang(lang), R.map(TaxonVernacularName.getName), (names) => names.sort())

export const getTaxonSingleVernacularNameText = (lang) => R.pipe(getTaxonVernacularNamesText(lang), R.head)

// ==== READ (fetch from DB)
export const fetchTaxonomyByName = async (surveyId, name, draft) => {
  const taxonomies = await TaxonomyManager.fetchTaxonomiesBySurveyId({ surveyId, draft })
  return R.find((taxonomy) => Taxonomy.getName(taxonomy) === name)(taxonomies)
}

export const fetchTaxonomyUuidByName = async (surveyId, name, draft) => {
  const taxonomy = await fetchTaxonomyByName(surveyId, name, draft)
  return Taxonomy.getUuid(taxonomy)
}

export const fetchTaxonByCode = async (surveyId, taxonomyUuid, code, draft) => {
  const taxa = await TaxonomyManager.fetchTaxaWithVernacularNames({ surveyId, taxonomyUuid, draft })
  return R.find((taxon) => Taxon.getCode(taxon) === code)(taxa)
}

// ==== UPDATE
export const updateTaxonWithNewVernacularNames = async (user, surveyId, taxonomyName, taxonCode, lang, names) => {
  const taxonomyUuid = await fetchTaxonomyUuidByName(surveyId, taxonomyName, true)

  // Load taxon
  const taxon = await fetchTaxonByCode(surveyId, taxonomyUuid, taxonCode, true)

  // Create new vernacular name or updated existing one
  const vernacularNamesArrayNew = R.map((name) => TaxonVernacularName.newTaxonVernacularName(lang, name))(names)
  const taxonNew = Taxon.assocVernacularNames(lang, vernacularNamesArrayNew)(taxon)
  const taxonUpdated = Taxon.mergeProps(taxonNew)(taxon)

  // Update taxon
  await TaxonomyManager.updateTaxonAndVernacularNames(user, surveyId, taxonUpdated)

  return {
    vernacularNamesNew: Taxon.getVernacularNamesByLang(lang)(taxonUpdated),
    vernacularNamesOld: Taxon.getVernacularNamesByLang(lang)(taxon),
  }
}

// Import
export const importFile = async (user, surveyId, taxonomyName, importFileName) => {
  // Fetch or create new taxonomy
  const taxonomies = await TaxonomyManager.fetchTaxonomiesBySurveyId({ surveyId, draft: true })
  const taxonomyExisting = R.find((taxonomy) => Taxonomy.getName(taxonomy) === taxonomyName)(taxonomies)
  let taxonomy = null
  if (taxonomyExisting) {
    taxonomy = taxonomyExisting
  } else {
    taxonomy = Taxonomy.newTaxonomy({ [Taxonomy.keysProps.name]: taxonomyName })
    await TaxonomyManager.insertTaxonomy({ user, surveyId, taxonomy })
  }

  const taxonomyUuid = Taxonomy.getUuid(taxonomy)
  const job = new TaxonomyImportJob({
    user,
    surveyId,
    taxonomyUuid,
    filePath: path.join(__dirname, 'importJobFiles', importFileName),
  })
  await job.start()

  return { job, taxonomyUuid }
}
