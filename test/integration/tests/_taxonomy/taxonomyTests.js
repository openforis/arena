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

import { getContextUser } from '../../config/context'
import * as SB from '../../../utils/surveyBuilder'
import * as TaxonomyUtils from './taxonomyUtils'

const taxonomyNameDefault = 'species_list'

const getContext = () => {
  const survey = global.applicableSurvey
  return { survey }
}

beforeAll(async () => {
  const user = getContextUser()
  global.applicableSurvey = await SB.survey(
    user,
    // Cluster
    SB.entity('cluster', SB.attribute('cluster_no', NodeDef.nodeDefType.integer).key())
  )
    .taxonomies(
      SB.taxonomy(taxonomyNameDefault).taxa(
        SB.taxon('AFZ/QUA', 'Fabaceae', 'Afzelia', 'Afzelia quanzensis')
          .vernacularName('eng', 'Mahogany')
          .vernacularName('swa', 'Mbambakofi'),
        SB.taxon('OLE/CAP', 'Oleacea', 'Olea', 'Olea capensis')
      )
    )
    .buildAndStore(false)
})

afterAll(async () => {
  const { survey } = getContext()
  if (survey) {
    await SurveyManager.deleteSurvey(Survey.getId(survey))
  }
})

export const taxonomyTests = async () => {
  const { survey } = getContext()
  const taxonomies = await TaxonomyManager.fetchTaxonomiesBySurveyId({ surveyId: Survey.getId(survey), draft: true })
  expect(taxonomies.length).to.be.equal(1, 'None or more than one taxonomies found')
  const taxonomy = R.head(taxonomies)
  expect(Taxonomy.getName(taxonomy)).toBe(taxonomyNameDefault)

  const taxaCount = await TaxonomyManager.countTaxaByTaxonomyUuid(
    Survey.getId(survey),
    Taxonomy.getUuid(taxonomy),
    true
  )
  expect(taxaCount).toBe(2)
}

export const taxonomyUpdateTest = async () => {
  const { survey } = getContext()
  const user = getContextUser()
  const surveyId = Survey.getId(survey)
  const taxonomyUuid = await TaxonomyUtils.fetchTaxonomyUuidByName(surveyId, taxonomyNameDefault, true)

  const taxonomyNameUpdated = 'species_list_updated'
  await TaxonomyManager.updateTaxonomyProp(user, surveyId, taxonomyUuid, Taxonomy.keysProps.name, taxonomyNameUpdated)

  const taxonomyUpdated = TaxonomyUtils.fetchTaxonomyByName(surveyId, taxonomyNameUpdated, true)
  /* eslint-disable no-unused-expressions */
  expect(taxonomyUpdated).toBeDefined()

  // Restore original taxonomy name
  await TaxonomyManager.updateTaxonomyProp(user, surveyId, taxonomyUuid, Taxonomy.keysProps.name, taxonomyNameDefault)
}

/**
 * Insert new taxa and expect taxa count to become 5.
 */
export const taxaInsertTest = async () => {
  const { survey } = getContext()
  const user = getContextUser()
  const surveyId = Survey.getId(survey)
  const taxonomyUuid = await TaxonomyUtils.fetchTaxonomyUuidByName(surveyId, taxonomyNameDefault, true)

  const taxa = [
    Taxon.newTaxon({ taxonomyUuid, code: 'ALB', family: 'Fabaceae', genus: 'Albizia', scientificName: 'Albizia' }),
    Taxon.newTaxon({
      taxonomyUuid,
      code: 'ALB/SCH',
      family: 'Fabaceae',
      genus: 'Albizia',
      scientificName: 'Albizia schimperiana',
    }),
    Taxon.newTaxon({
      taxonomyUuid,
      code: 'ALB/GLA',
      family: 'Fabaceae',
      genus: 'Albizia',
      scientificName: 'Albizia glaberrima',
      vernacularNames: {
        swa: [
          TaxonVernacularName.newTaxonVernacularName('swa', 'Mgerenge'),
          TaxonVernacularName.newTaxonVernacularName('swa', 'Mchani'),
        ],
      },
    }),
  ]

  await TaxonomyManager.insertTaxa({ user, surveyId, taxa })

  const taxaCount = await TaxonomyManager.countTaxaByTaxonomyUuid(Survey.getId(survey), taxonomyUuid, true)
  expect(taxaCount).toBe(5)
}

/**
 * Update existing taxon with new props.
 */
export const taxonUpdateTest = async () => {
  const { survey } = getContext()
  const user = getContextUser()
  const surveyId = Survey.getId(survey)
  const taxonomy = await TaxonomyUtils.fetchTaxonomyByName(surveyId, taxonomyNameDefault, true)
  const taxonomyUuid = Taxonomy.getUuid(taxonomy)

  const taxonCode = 'ALB/GLA'
  const taxon = await TaxonomyManager.fetchTaxonByCode(surveyId, taxonomyUuid, taxonCode, true)
  const taxonNew = Taxon.newTaxon({
    taxonomyUuid,
    code: taxonCode,
    family: 'Fabaceae updated',
    genus: 'Albizia updated',
    scientificName: 'Albizia glaberrima updated',
  })

  const taxonUpdated = Taxon.mergeProps(taxonNew)(taxon)
  await TaxonomyManager.updateTaxonAndVernacularNames(user, surveyId, taxonUpdated)

  const taxonReloaded = await TaxonomyManager.fetchTaxonByCode(surveyId, taxonomyUuid, taxonCode, true)

  /* eslint-disable no-unused-expressions */
  expect(taxonReloaded).toBeDefined()

  expect(Taxon.getProps(taxonReloaded)).toEqual(Taxon.getProps(taxonNew))
}

const _importFile = async (taxonomyName, importFileName) => {
  const { survey } = getContext()
  return TaxonomyUtils.importFile(getContextUser(), Survey.getId(survey), taxonomyName, importFileName)
}

export const taxonomyImportErrorMissingColumnsTest = async () => {
  const { job } = await _importFile(
    taxonomyNameDefault,
    'species list test (short with vernacular names) (errors) (missing columns).csv'
  )
  expect(job.status).toBe(jobStatus.failed)
  expect(R.path(['errors', '1', 'all', 'errors', '0', 'key'], job)).toBe(
    Validation.messageKeys.taxonomyImportJob.missingRequiredColumns
  )
}

export const taxonomyImportErrorDuplicateItemsTest = async () => {
  const { job } = await _importFile(taxonomyNameDefault, 'species list test (short with vernacular names) (errors).csv')
  expect(job.status).toBe(jobStatus.failed)
}

export const taxonomyImportNewTest = async () => {
  const { survey } = getContext()
  const { job, taxonomyUuid } = await _importFile('New taxonomy', 'species list test (short with vernacular names).csv')

  // Check that the job completed successfully
  expect(job.status).toBe(jobStatus.succeeded)
  // Check that the correct number of taxa has been imported
  const taxa = await TaxonomyManager.fetchTaxaWithVernacularNames({
    surveyId: Survey.getId(survey),
    taxonomyUuid,
    draft: true,
  })
  expect(taxa.length).toBe(14 /* 12 items + Unlisted + Unknown */)

  // Check that all taxon props have been imported
  {
    const taxon = taxa.find((t) => Taxon.getCode(t) === 'AFZ/QUA')
    /* eslint-disable no-unused-expressions */
    expect(taxon).toBeDefined()
    expect(Taxon.getProps(taxon)).toEqual({
      [Taxon.propKeys.code]: 'AFZ/QUA',
      [Taxon.propKeys.family]: 'Fabaceae',
      [Taxon.propKeys.genus]: 'Afzelia',
      [Taxon.propKeys.scientificName]: 'Afzelia quanzensis',
    })
    // Check vernacular names
    expect(TaxonomyUtils.getTaxonSingleVernacularNameText('eng')(taxon)).toBe('Mahogany')
  }

  // Check that multiple vernacular names are imported correctly
  {
    const taxon = taxa.find((t) => Taxon.getCode(t) === 'ALB/GLA')
    /* eslint-disable no-unused-expressions */
    expect(taxon).toBeDefined()
    const vernacularNames = TaxonomyUtils.getTaxonVernacularNamesText('swa')(taxon)
    expect(vernacularNames).toEqual(['Mchani', 'Mgerenge'])
  }
}
