const db = require('../../db/db')

const {Job} = require('../../job/job')

const NodeDefRepository = require('../../nodeDef/nodeDefRepository')
const SurveyRepository = require('../surveyRepository')
const CodeListManager = require('../../codeList/codeListManager')
const TaxonomyManager = require('../../taxonomy/taxonomyManager')

class SurveyPropsPublishJob extends Job {

  constructor (userId, surveyId) {
    super(userId, surveyId, 'survey-props-publish')
  }

  async execute () {
    const id = this.surveyId
    await db.tx(async t => {
      await NodeDefRepository.publishNodeDefsProps(id, t)

      await NodeDefRepository.permanentlyDeleteNodeDefs(id, t)

      await CodeListManager.publishCodeListsProps(id, t)

      await TaxonomyManager.publishTaxonomiesProps(id, t)

      await SurveyRepository.publishSurveyProps(id, t)

      this.setStatusSucceeded()
    })
  }
}

module.exports = SurveyPropsPublishJob