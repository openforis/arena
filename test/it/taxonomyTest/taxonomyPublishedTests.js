import { expect } from 'chai'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as TaxonomyManager from '@server/modules/taxonomy/manager/taxonomyManager'

import { getContextUser } from '../../testContext'
import * as SB from '../utils/surveyBuilder'
import * as TaxonomyUtils from '../utils/taxonomyUtils'
import * as SurveyUtils from '../utils/surveyUtils'

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
    SB.taxon('ALB/GLA', 'Fabaceae', 'Albizia', 'Albizia glaberrima'),
    SB.taxon('AFZ/QUA', 'Fabaceae', 'Afzelia', 'Afzelia quanzensis')
      .vernacularName('en', 'Mahogany')
      .vernacularName('sw', 'Mbambakofi'),
    SB.taxon('OLE/CAP', 'Oleacea', 'Olea', 'Olea capensis')
  ).buildAndStore()
})

after(async () => {
  if (survey)
    await SurveyManager.deleteSurvey(Survey.getId(survey))
})

const _addVernacularNameToTaxon = async (taxonCode, lang, name) =>
  TaxonomyUtils.addVernacularNameToTaxon(getContextUser(), Survey.getId(survey), taxonomyName, taxonCode, lang, name)

const _publishSurvey = async () =>
  SurveyUtils.publishSurvey(getContextUser(), Survey.getId(survey))

export const taxonPublishedUpdateTest = async () => {
  const user = getContextUser()
  const surveyId = Survey.getId(survey)
  const taxonomyUuid = await TaxonomyUtils.fetchTaxonomyUuidByName(surveyId, taxonomyName, false)
  const taxonCode = 'ALB/GLA'

  // load taxon
  const taxonPublished = await TaxonomyManager.fetchTaxonByCode(surveyId, taxonomyUuid, taxonCode, false)

  // update taxon
  const taxonNew = Taxon.newTaxon(taxonomyUuid, taxonCode, 'Fabaceae updated', 'Albizia updated', 'Albizia glaberrima updated')
  const taxonUpdated = Taxon.mergeProps(taxonNew)(taxonPublished)
  await TaxonomyManager.updateTaxon(user, surveyId, taxonUpdated)

  // reload taxon
  const taxonReloaded = await TaxonomyManager.fetchTaxonByCode(surveyId, taxonomyUuid, taxonCode, true)
  // check that it exists
  expect(taxonReloaded).to.be.not.undefined
  // check that its props have been updated
  expect(Taxon.getProps(taxonReloaded)).to.deep.equal(Taxon.getProps(taxonNew), 'Taxon props have not been updated')
  // check that its published props haven't been updated
  const taxonPublishedReloaded = await TaxonomyManager.fetchTaxonByCode(surveyId, taxonomyUuid, taxonCode, false)
  expect(Taxon.getProps(taxonPublishedReloaded)).to.deep.equal(Taxon.getProps(taxonPublished), 'Taxon published props have been updated')

  await _publishSurvey()
}

export const taxonPublishedAddVernacularNameTest = async () => {
  const surveyId = Survey.getId(survey)
  const taxonomyUuid = await TaxonomyUtils.fetchTaxonomyUuidByName(surveyId, taxonomyName, false)
  const taxonCode = 'OLE/CAP'
  const lang = 'sw'

  // add vernacular name
  const { vernacularNameNew } = await _addVernacularNameToTaxon(taxonCode, lang, 'English Vernacular Name')

  // reload vernacular name
  const taxonReloaded = await TaxonomyUtils.fetchTaxonByCode(surveyId, taxonomyUuid, taxonCode, true)
  const vernacularNameReloaded = Taxon.getVernacularNameByLang(lang)(taxonReloaded)

  // check that new vernacular name exists
  expect(vernacularNameReloaded).to.not.be.undefined
  // check that its uuid is the same as the one passed to the manager
  expect(TaxonVernacularName.getUuid(vernacularNameReloaded)).to.be.equal(TaxonVernacularName.getUuid(vernacularNameNew), 'Vernacular name inserted with different UUID')
  // check that its properties are the same as the one passed to the manager
  expect(TaxonVernacularName.getName(vernacularNameReloaded)).to.deep.equal(TaxonVernacularName.getName(vernacularNameNew), 'Vernacular name has not been updated')

  await _publishSurvey()
}

export const taxonPublishedUpdateVernacularNameTest = async () => {
  const surveyId = Survey.getId(survey)
  const taxonomyUuid = await TaxonomyUtils.fetchTaxonomyUuidByName(surveyId, taxonomyName, false)
  const taxonCode = 'AFZ/QUA'
  const lang = 'sw'

  // update vernacular name
  const { vernacularNameNew, vernacularNameOld } = await _addVernacularNameToTaxon(taxonCode, lang, 'New Swahili')

  // reload vernacular name
  const taxonReloaded = await TaxonomyUtils.fetchTaxonByCode(surveyId, taxonomyUuid, taxonCode, true)
  const vernacularNameReloaded = Taxon.getVernacularNameByLang(lang)(taxonReloaded)
  // check that its uuid has not changed
  expect(TaxonVernacularName.getUuid(vernacularNameReloaded)).to.be.equal(TaxonVernacularName.getUuid(vernacularNameOld), 'Vernacular name uuid changed')
  // check that its props have been updated
  expect(TaxonVernacularName.getName(vernacularNameReloaded)).to.deep.equal(TaxonVernacularName.getName(vernacularNameNew), 'Vernacular name has not been updated')
  // check that other vernacular names haven't changed
  expect(TaxonVernacularName.getName(Taxon.getVernacularNameByLang('en')(taxonReloaded))).to.be.equal('Mahogany', 'Other (unexpected) vernacular name has been updated')

  await _publishSurvey()
}
