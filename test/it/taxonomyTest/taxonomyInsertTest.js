import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Taxonomy from '@core/survey/taxonomy'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as TaxonomyManager from '@server/modules/taxonomy/manager/taxonomyManager'

import { getContextUser } from '../../testContext'
import * as SB from '../utils/surveyBuilder'
import { expect } from 'chai'

let survey = null

before(async () => {
  const user = getContextUser()

  survey = await SB.survey(user,
    // cluster
    SB.entity('cluster',
      SB.attribute('cluster_no', NodeDef.nodeDefType.integer).key(),

      // --> plot
      SB.entity('plot',
        SB.attribute('plot_no', NodeDef.nodeDefType.integer).key(),

        //--> tree
        SB.entity('tree',
          SB.attribute('tree_no', NodeDef.nodeDefType.integer).key(),
          SB.attribute('tree_dbh', NodeDef.nodeDefType.decimal),
          SB.attribute('tree_height', NodeDef.nodeDefType.decimal),
          SB.attribute('tree_volume', NodeDef.nodeDefType.decimal).analysis(),
        ).multiple()
      ).multiple()
    )
  ).buildAndStore()
})

after(async () => {
  if (survey)
    await SurveyManager.deleteSurvey(Survey.getId(survey))
})

export const taxonomyInsertTest = async () => {
  const taxonomyName = 'Simple Taxonomy'
  const taxonomy = Taxonomy.newTaxonomy({ [Taxonomy.keysProps.name]: taxonomyName })
  const taxonomyPersisted = await TaxonomyManager.insertTaxonomy(getContextUser(), Survey.getId(survey), taxonomy)

  expect(taxonomyPersisted).to.not.be.undefined

  expect(Taxonomy.getName(taxonomyPersisted)).to.be.equal(taxonomyName)
}

