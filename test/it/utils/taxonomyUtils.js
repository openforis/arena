import * as R from 'ramda'

import * as Taxonomy from '@core/survey/taxonomy'
import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'

import * as TaxonomyManager from '@server/modules/taxonomy/manager/taxonomyManager'

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
  const vernacularNameOld = Taxon.getVernacularNameByLang(lang)(taxon)
  const vernacularName = vernacularNameOld ? TaxonVernacularName.mergeProps(vernacularNameNew)(vernacularNameOld) : vernacularNameNew

  // update taxon
  const taxonUpdated = await Taxon.assocVernacularName(lang, vernacularName)(taxon)
  await TaxonomyManager.updateTaxa(user, surveyId, [taxonUpdated])

  return { vernacularNameNew, vernacularNameOld }
}