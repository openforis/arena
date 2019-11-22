import { expect } from 'chai'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'
import * as Validation from '@core/validation/validation'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as TaxonomyManager from '@server/modules/taxonomy/manager/taxonomyManager'
import { jobStatus } from '@server/job/jobUtils'

import { getContextUser } from '../../testContext'
import * as SB from '../utils/surveyBuilder'
import * as TaxonomyUtils from './taxonomyUtils'

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

const _importFile = async (taxonomyName, importFileName) =>
  TaxonomyUtils.importFile(getContextUser(), Survey.getId(survey), taxonomyName, importFileName)

export const taxonomyImportErrorMissingColumnsTest = async () => {
  const { job } = await _importFile(taxonomyName, 'species list test (short with vernacular names) (errors) (missing columns).csv')
  expect(job.status).to.be.equal(jobStatus.failed)
  expect(R.path(['errors', '1', 'all', 'errors', '0', 'key'], job)).to.be.equal(Validation.messageKeys.taxonomyImportJob.missingRequiredColumns)
}

export const taxonomyImportErrorDuplicateItemsTest = async () => {
  const { job } = await _importFile(taxonomyName, 'species list test (short with vernacular names) (errors).csv')
  expect(job.status).to.be.equal(jobStatus.failed)
}

export const taxonomyImportNewTest = async () => {
  const { job, taxonomyUuid } = await _importFile('New taxonomy', 'species list test (short with vernacular names).csv')

  // check that the job completed successfully
  expect(job.status).to.be.equal(jobStatus.succeeded, `Failed to run TaxonomyImportJob: ${JSON.stringify(job)}`)
  // check that the correct number of taxa has been imported
  const taxa = await TaxonomyManager.fetchTaxaWithVernacularNames(Survey.getId(survey), taxonomyUuid, true)
  expect(taxa.length).to.be.equal(14 /*12 items + Unlisted + Unknown */, '')

  // check that all taxon props have been imported
  {
    const taxon = R.find(taxon => Taxon.getCode(taxon) === 'AFZ/QUA', taxa)
    expect(taxon).to.not.be.undefined
    expect(Taxon.getProps(taxon)).to.be.deep.equal({
      [Taxon.propKeys.code]: 'AFZ/QUA',
      [Taxon.propKeys.family]: 'Fabaceae',
      [Taxon.propKeys.genus]: 'Afzelia',
      [Taxon.propKeys.scientificName]: 'Afzelia quanzensis',
    }, 'Taxon not imported correctly')
    // check vernacular names
    expect(TaxonomyUtils.getTaxonSingleVernacularName('eng')(taxon)).to.be.equal('Mahogany', 'Vernacular name not imported correctly')
  }
  // check that multiple vernacular names are imported correctly
  {
    const taxon = R.find(taxon => Taxon.getCode(taxon) === 'ALB/GLA', taxa)
    expect(taxon).to.not.be.undefined
    const vernacularNames = TaxonomyUtils.getTaxonVernacularNames('swa')(taxon)
    expect(vernacularNames).to.be.deep.equal(['Mchani', 'Mgerenge'])
  }
}

