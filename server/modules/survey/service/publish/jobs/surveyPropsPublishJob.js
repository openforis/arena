const R = require('ramda')

const Job = require('../../../../../job/job')

const Survey = require('../../../../../../common/survey/survey')
const NodeDefManager = require('../../../../nodeDef/persistence/nodeDefManager')
const SurveyManager = require('../../../persistence/surveyManager')
const CategoryManager = require('../../../../category/persistence/categoryManager')
const TaxonomyManager = require('../../../../taxonomy/persistence/taxonomyManager')

const ActivityLog = require('../../../../activityLog/activityLogger')

const determineDeletedLanguages = async (surveyId, t) => {
  const survey = await SurveyManager.fetchSurveyById(surveyId, true, false, t)
  const surveyInfo = Survey.getSurveyInfo(survey)
  if (Survey.isPublished(surveyInfo)) {
    const publishedSurvey = await SurveyManager.fetchSurveyById(surveyId, false, false, t)
    const publishedSurveyInfo = Survey.getSurveyInfo(publishedSurvey)
    return R.difference(Survey.getLanguages(publishedSurveyInfo), Survey.getLanguages(surveyInfo))
  } else {
    return []
  }
}

class SurveyPropsPublishJob extends Job {

  constructor (params) {
    super(SurveyPropsPublishJob.type, params)
  }

  async execute (tx) {
    this.total = 8

    const id = this.getSurveyId()

    const deletedLanguages = await determineDeletedLanguages(id, tx)
    this.incrementProcessedItems()

    await NodeDefManager.publishNodeDefsProps(id, tx)
    this.incrementProcessedItems()

    await NodeDefManager.permanentlyDeleteNodeDefs(id, tx)
    this.incrementProcessedItems()

    await CategoryManager.publishProps(id, tx)
    this.incrementProcessedItems()

    await TaxonomyManager.publishTaxonomiesProps(id, tx)
    this.incrementProcessedItems()

    const surveyInfo = await SurveyManager.publishSurveyProps(id, tx)
    this.incrementProcessedItems()

    await this.removeDeletedLanguagesLabels(deletedLanguages, tx)
    this.incrementProcessedItems()

    await ActivityLog.log(this.getUser(), id, ActivityLog.type.surveyPublish, { surveyUuid: Survey.getUuid(surveyInfo) }, tx)
    this.incrementProcessedItems()
  }

  async removeDeletedLanguagesLabels (deletedLanguages, t) {
    const surveyId = this.getSurveyId()

    for (const langCode of deletedLanguages) {

      //SURVEY
      await SurveyManager.deleteSurveyLabel(surveyId, langCode, t)
      await SurveyManager.deleteSurveyDescription(surveyId, langCode, t)

      //NODE DEFS
      await NodeDefManager.deleteNodeDefsLabels(surveyId, langCode, t)
      await NodeDefManager.deleteNodeDefsDescriptions(surveyId, langCode, t)

      //CATEGORY ITEMS
      await CategoryManager.deleteItemLabels(surveyId, langCode, t)
    }
  }
}

SurveyPropsPublishJob.type = 'SurveyPropsPublishJob'

module.exports = SurveyPropsPublishJob