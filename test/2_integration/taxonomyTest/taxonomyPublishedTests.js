import { expect } from 'chai'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as TaxonomyManager from '@server/modules/taxonomy/manager/taxonomyManager'

import { getContextUser } from '../../testContext'
import * as SB from '../utils/surveyBuilder'
import * as SurveyUtils from '../utils/surveyUtils'
import * as TaxonomyUtils from './taxonomyUtils'

const taxonomyName = 'species_list'
let survey = null

beforeAll(async () => {
  const user = getContextUser()

  survey = await SB.survey(
    user,
    // Cluster
    SB.entity('cluster', SB.attribute('cluster_no', NodeDef.nodeDefType.integer).key())
  )
    .taxonomy(
      taxonomyName,
      SB.taxon('ALB/GLA', 'Fabaceae', 'Albizia', 'Albizia glaberrima'),
      SB.taxon('AFZ/QUA', 'Fabaceae', 'Afzelia', 'Afzelia quanzensis')
        .vernacularName('eng', 'Mahogany')
        .vernacularName('swa', 'Mbambakofi'),
      SB.taxon('OLE/CAP', 'Oleacea', 'Olea', 'Olea capensis')
    )
    .buildAndStore()
})

afterAll(async () => {
  if (survey) {
    await SurveyManager.deleteSurvey(Survey.getId(survey))
  }
})

const _updateTaxonWithNewVernacularNames = async (taxonCode, lang, names) =>
  TaxonomyUtils.updateTaxonWithNewVernacularNames(
    getContextUser(),
    Survey.getId(survey),
    taxonomyName,
    taxonCode,
    lang,
    names
  )

const _publishSurvey = async () => SurveyUtils.publishSurvey(getContextUser(), Survey.getId(survey))

export const taxonPublishedUpdateTest = async () => {
  const user = getContextUser()
  const surveyId = Survey.getId(survey)
  const taxonomyUuid = await TaxonomyUtils.fetchTaxonomyUuidByName(surveyId, taxonomyName, false)
  const taxonCode = 'ALB/GLA'

  // Load taxon
  const taxonPublished = await TaxonomyManager.fetchTaxonByCode(surveyId, taxonomyUuid, taxonCode, false)

  // Update taxon
  const taxonNew = Taxon.newTaxon(
    taxonomyUuid,
    taxonCode,
    'Fabaceae updated',
    'Albizia updated',
    'Albizia glaberrima updated'
  )
  const taxonUpdated = Taxon.mergeProps(taxonNew)(taxonPublished)
  await TaxonomyManager.updateTaxon(user, surveyId, taxonUpdated)

  // Reload taxon
  const taxonReloaded = await TaxonomyManager.fetchTaxonByCode(surveyId, taxonomyUuid, taxonCode, true)
  // Check that it exists
  /* eslint-disable no-unused-expressions */
  expect(taxonReloaded).to.be.not.undefined
  // Check that its props have been updated
  expect(Taxon.getProps(taxonReloaded)).to.deep.equal(Taxon.getProps(taxonNew), 'Taxon props have not been updated')
  // Check that its published props haven't been updated
  const taxonPublishedReloaded = await TaxonomyManager.fetchTaxonByCode(surveyId, taxonomyUuid, taxonCode, false)
  expect(Taxon.getProps(taxonPublishedReloaded)).to.deep.equal(
    Taxon.getProps(taxonPublished),
    'Taxon published props have been updated'
  )

  await _publishSurvey()
}

export const taxonPublishedAddVernacularNameTest = async () => {
  const surveyId = Survey.getId(survey)
  const taxonomyUuid = await TaxonomyUtils.fetchTaxonomyUuidByName(surveyId, taxonomyName, false)
  const taxonCode = 'OLE/CAP'
  const lang = 'swa'

  // Add vernacular name
  const { vernacularNamesNew } = await _updateTaxonWithNewVernacularNames(taxonCode, lang, ['Swahili Vernacular Name'])
  const vernacularNameNew = R.head(vernacularNamesNew)

  // Reload vernacular name
  const taxonReloaded = await TaxonomyUtils.fetchTaxonByCode(surveyId, taxonomyUuid, taxonCode, true)
  const vernacularNameReloaded = R.pipe(Taxon.getVernacularNamesByLang(lang), R.head)(taxonReloaded)

  // Check that new vernacular name exists
  /* eslint-disable no-unused-expressions */
  expect(vernacularNameReloaded).to.not.be.undefined
  // Check that its uuid is the same as the one passed to the manager
  expect(TaxonVernacularName.getUuid(vernacularNameReloaded)).to.be.equal(
    TaxonVernacularName.getUuid(vernacularNameNew),
    'Vernacular name inserted with different UUID'
  )
  // Check that its properties are the same as the one passed to the manager
  expect(TaxonVernacularName.getName(vernacularNameReloaded)).to.equal(
    TaxonVernacularName.getName(vernacularNameNew),
    'Vernacular name has not been inserted correctly'
  )

  await _publishSurvey()
}

export const taxonPublishedUpdateVernacularNamesTest = async () => {
  const surveyId = Survey.getId(survey)
  const taxonomyUuid = await TaxonomyUtils.fetchTaxonomyUuidByName(surveyId, taxonomyName, false)
  const taxonCode = 'AFZ/QUA'
  const lang = 'swa'
  const name1 = 'Mbambakofi updated'
  const name2 = 'New Swahili name'

  // Update taxon vernacular names
  const { vernacularNamesOld } = await _updateTaxonWithNewVernacularNames(taxonCode, lang, [name1, name2])
  const vernacularName1Old = R.head(vernacularNamesOld)

  // Reload vernacular name
  const taxonReloaded = await TaxonomyUtils.fetchTaxonByCode(surveyId, taxonomyUuid, taxonCode, true)
  const vernacularNamesReloaded = Taxon.getVernacularNamesByLang(lang)(taxonReloaded)
  // Check that the old vernacular name has been updated correctly
  const vernacularName1Reloaded = R.find((vn) => TaxonVernacularName.getName(vn) === name1)(vernacularNamesReloaded)
  /* eslint-disable no-unused-expressions */
  expect(vernacularName1Reloaded).to.be.not.undefined
  // Check that the uuid of the old vernacular name has not changed
  expect(TaxonVernacularName.getUuid(vernacularName1Reloaded)).to.be.equal(
    TaxonVernacularName.getUuid(vernacularName1Old),
    'Existing vernacular name UUID changed'
  )
  // Check that the new vernacular name has been inserted correctly
  const vernacularName2Reloaded = R.find((vn) => TaxonVernacularName.getName(vn) === name2)(vernacularNamesReloaded)
  /* eslint-disable no-unused-expressions */
  expect(vernacularName2Reloaded).to.be.not.undefined

  await _publishSurvey()
}
