const R = require('ramda')

const db = require('../../db/db')

const Job = require('../../job/job')

const NodeDefRepository = require('../../nodeDef/nodeDefRepository')
const SurveyRepository = require('../surveyRepository')
const CategoryManager = require('../../category/categoryManager')
const CategoryRepository = require('../../category/categoryRepository')
const TaxonomyManager = require('../../taxonomy/taxonomyManager')

const determineDeletedLanguages = async (surveyId, t) => {
  const survey = await SurveyRepository.getSurveyById(surveyId, true, t)
  if (survey.published) {
    const publishedSurvey = await SurveyRepository.getSurveyById(surveyId, false, t)
    return R.difference(publishedSurvey.props.languages, survey.props.languages)
  } else {
    return []
  }
}

class SurveyPropsPublishJob extends Job {

  constructor (params) {
    super(SurveyPropsPublishJob.type, params)
  }

  async execute () {
    this.total = 8

    const id = this.surveyId

    await db.tx(async t => {
      const deletedLanguages = await determineDeletedLanguages(id, t)

      await NodeDefRepository.publishNodeDefsProps(id, t)

      this.incrementProcessedItems()

      await NodeDefRepository.permanentlyDeleteNodeDefs(id, t)

      this.incrementProcessedItems()

      await CategoryManager.publishProps(id, t)

      this.incrementProcessedItems()

      await TaxonomyManager.publishTaxonomiesProps(id, t)

      this.incrementProcessedItems()

      await SurveyRepository.publishSurveyProps(id, t)

      this.incrementProcessedItems()

      await this.removeDeletedLanguagesLabels(deletedLanguages, t)

      this.setStatusSucceeded()
    })
  }

  async removeDeletedLanguagesLabels (deletedLanguages, t) {
    const surveyId = this.params.surveyId

    for (let i = 0; i < deletedLanguages.length; i++) {
      const langCode = deletedLanguages[i]

      //SURVEY
      await SurveyRepository.deleteSurveyLabel(surveyId, langCode, t)
      await SurveyRepository.deleteSurveyDescription(surveyId, langCode, t)
      this.incrementProcessedItems()

      //NODE DEFS
      await NodeDefRepository.deleteNodeDefsLabels(surveyId, langCode, t)
      await NodeDefRepository.deleteNodeDefsDescriptions(surveyId, langCode, t)
      this.incrementProcessedItems()

      //CATEGORY ITEMS
      await CategoryRepository.deleteItemLabels(surveyId, langCode, t)
      this.incrementProcessedItems()
    }
  }
}

SurveyPropsPublishJob.type = 'SurveyPropsPublishJob'

module.exports = SurveyPropsPublishJob