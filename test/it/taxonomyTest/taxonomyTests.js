import { expect } from 'chai'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as TaxonomyManager from '@server/modules/taxonomy/manager/taxonomyManager'

import { getContextUser } from '../../testContext'
import * as SB from '../utils/surveyBuilder'
import * as TaxonomyUtils from '../utils/taxonomyUtils'

const taxonomyName = 'species_list'
let survey = null

before(async () => {
  const user = getContextUser()
  survey = await SB.survey(user,
    // cluster
    SB.entity('cluster',
      SB.attribute('cluster_no', NodeDef.nodeDefType.integer).key(),
    )
  ).taxonomy(taxonomyName,
    SB.taxon('AFZ/QUA', 'Fabaceae', 'Afzelia', 'Afzelia quanzensis')
      .vernacularName('eng', 'Mahogany')
      .vernacularName('swa', 'Mbambakofi'),
    SB.taxon('OLE/CAP', 'Oleacea', 'Olea', 'Olea capensis')
  ).buildAndStore(false)
})

after(async () => {
  if (survey)
    await SurveyManager.deleteSurvey(Survey.getId(survey))
})

export const taxonomyTests = async () => {
  const taxonomies = await TaxonomyManager.fetchTaxonomiesBySurveyId(Survey.getId(survey), true)
  expect(taxonomies.length).to.be.equal(1, 'None or more than one taxonomies found')
  const taxonomy = R.head(taxonomies)
  expect(Taxonomy.getName(taxonomy)).to.be.equal(taxonomyName)

  const taxaCount = await TaxonomyManager.countTaxaByTaxonomyUuid(Survey.getId(survey), Taxonomy.getUuid(taxonomy), true)
  expect(taxaCount).to.be.equal(2)
}

export const taxonomyUpdateTest = async () => {
  const user = getContextUser()
  const surveyId = Survey.getId(survey)
  const taxonomyUuid = await TaxonomyUtils.fetchTaxonomyUuidByName(surveyId, taxonomyName, true)

  const taxonomyNameUpdated = 'species_list_updated'
  await TaxonomyManager.updateTaxonomyProp(user, surveyId, taxonomyUuid, Taxonomy.keysProps.name, taxonomyNameUpdated)

  const taxonomyUpdated = TaxonomyUtils.fetchTaxonomyByName(surveyId, taxonomyNameUpdated, true)
  expect(taxonomyUpdated).to.be.not.undefined

  // restore original taxonomy name
  await TaxonomyManager.updateTaxonomyProp(user, surveyId, taxonomyUuid, Taxonomy.keysProps.name, taxonomyName)
}

/**
 * Insert new taxa and expect taxa count to become 5
 */
export const taxaInsertTest = async () => {
  const user = getContextUser()
  const surveyId = Survey.getId(survey)
  const taxonomyUuid = await TaxonomyUtils.fetchTaxonomyUuidByName(surveyId, taxonomyName, true)

  const taxa = [
    Taxon.newTaxon(taxonomyUuid, 'ALB', 'Fabaceae', 'Albizia', 'Albizia'),
    Taxon.newTaxon(taxonomyUuid, 'ALB/SCH', 'Fabaceae', 'Albizia', 'Albizia schimperiana'),
    Taxon.newTaxon(taxonomyUuid, 'ALB/GLA', 'Fabaceae', 'Albizia', 'Albizia glaberrima', {
      'swa': [
        TaxonVernacularName.newTaxonVernacularName('swa', 'Mgerenge'),
        TaxonVernacularName.newTaxonVernacularName('swa', 'Mchani')
      ]
    }),
  ]

  await TaxonomyManager.insertTaxa(user, surveyId, taxa)

  const taxaCount = await TaxonomyManager.countTaxaByTaxonomyUuid(Survey.getId(survey), taxonomyUuid, true)
  expect(taxaCount).to.be.equal(5)
}

/**
 * Update existing taxon with new props
 */
export const taxonUpdateTest = async () => {
  const user = getContextUser()
  const surveyId = Survey.getId(survey)
  const taxonomy = await TaxonomyUtils.fetchTaxonomyByName(surveyId, taxonomyName, true)
  const taxonomyUuid = Taxonomy.getUuid(taxonomy)

  const taxonCode = 'ALB/GLA'
  const taxon = await TaxonomyManager.fetchTaxonByCode(surveyId, taxonomyUuid, taxonCode, true)
  const taxonNew = Taxon.newTaxon(taxonomyUuid, taxonCode, 'Fabaceae updated', 'Albizia updated', 'Albizia glaberrima updated')

  const taxonUpdated = Taxon.mergeProps(taxonNew)(taxon)
  await TaxonomyManager.updateTaxon(user, surveyId, taxonUpdated)

  const taxonReloaded = await TaxonomyManager.fetchTaxonByCode(surveyId, taxonomyUuid, taxonCode, true)

  expect(taxonReloaded).to.be.not.undefined

  expect(Taxon.getProps(taxonReloaded)).to.deep.equal(Taxon.getProps(taxonNew))
}
