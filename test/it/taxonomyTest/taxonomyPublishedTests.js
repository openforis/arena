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

export const taxonPublishedUpdateTest = async () => {
  const user = getContextUser()
  const surveyId = Survey.getId(survey)
  const taxonomyUuid = await TaxonomyUtils.fetchTaxonomyUuidByName(surveyId, taxonomyName, false)
  const taxonCode = 'ALB/GLA'
  // load taxon
  const taxonPublished = await TaxonomyManager.fetchTaxonByCode(surveyId, taxonomyUuid, taxonCode)

  // update taxon
  const taxonNew = Taxon.newTaxon(taxonomyUuid, taxonCode, 'Fabaceae updated', 'Albizia updated', 'Albizia glaberrima updated')
  const taxonUpdated = Taxon.mergeProps(taxonNew)(taxonPublished)

  await TaxonomyManager.updateTaxa(user, surveyId, [taxonUpdated])

  // reload taxon
  const taxonReloaded = await TaxonomyManager.fetchTaxonByCode(surveyId, taxonomyUuid, taxonCode, true)
  // check that it exists
  expect(taxonReloaded).to.be.not.undefined
  // check that its props have been updated
  expect(Taxon.getProps(taxonReloaded)).to.deep.equal(Taxon.getProps(taxonNew), 'Taxon props have not been updated')
  // check that its published props haven't been updated
  const taxonPublishedReloaded = await TaxonomyManager.fetchTaxonByCode(surveyId, taxonomyUuid, taxonCode, false)
  expect(Taxon.getProps(taxonPublishedReloaded)).to.deep.equal(Taxon.getProps(taxonPublished), 'Taxon published props have been updated')
}

export const taxonPublishedUpdateVernacularNamesTest = async () => {
  const user = getContextUser()
  const surveyId = Survey.getId(survey)
  const taxonomyUuid = await TaxonomyUtils.fetchTaxonomyUuidByName(surveyId, taxonomyName, false)
  const taxonCode = 'AFZ/QUA'

  // load taxon
  const taxon = await TaxonomyUtils.fetchTaxonWithVernarcularNamesByCode(surveyId, taxonomyUuid, taxonCode, false)

  // update vernacular name
  const vernacularNameOld = Taxon.getVernacularNameByLang('sw')(taxon)
  const vernacularNameUpdated = TaxonVernacularName.merge(TaxonVernacularName.newTaxonVernacularName('sw', 'New Swahili'))(vernacularNameOld)
  const taxonUpdated = Taxon.assocVernacularName('sw', vernacularNameUpdated)(taxon)

  await TaxonomyManager.updateTaxa(user, surveyId, [taxonUpdated])

  // reload taxon vernacular name
  const taxonReloaded = await TaxonomyUtils.fetchTaxonWithVernarcularNamesByCode(surveyId, taxonomyUuid, taxonCode, true)
  const vernacularNameReloaded = Taxon.getVernacularNameByLang('sw')(taxonReloaded)
  // check that its props have been updated
  expect(TaxonVernacularName.getProps(vernacularNameReloaded)).to.deep.equal(TaxonVernacularName.getProps(vernacularNameUpdated), 'Vernacular name props have not been updated')
  // check that its uuid has not changed
  expect(TaxonVernacularName.getUuid(vernacularNameReloaded)).to.equal(TaxonVernacularName.getUuid(vernacularNameOld), 'Vernacular name uuid changed')
}
