const R = require('ramda')

const Job = require('../../../../../job/job')

const Survey = require('../../../../../../common/survey/survey')

const NodeDefManager = require('../../../../nodeDef/manager/nodeDefManager')
const SurveyManager = require('../../../manager/surveyManager')
const CategoryManager = require('../../../../category/manager/categoryManager')
const TaxonomyManager = require('../../../../taxonomy/manager/taxonomyManager')

const ActivityLog = require('../../../../activityLog/activityLogger')

const findDeletedLanguages = async (surveyId, t) => {
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
    this.total = 7

    const id = this.getSurveyId()

    const langsDeleted = await findDeletedLanguages(id, tx)
    this.incrementProcessedItems()

    await NodeDefManager.permanentlyDeleteNodeDefs(id, tx)
    this.incrementProcessedItems()

    await NodeDefManager.publishNodeDefsProps(id, langsDeleted, tx)
    this.incrementProcessedItems()

    await CategoryManager.publishProps(id, langsDeleted, tx)
    this.incrementProcessedItems()

    await TaxonomyManager.publishTaxonomiesProps(id, tx)
    this.incrementProcessedItems()

    const surveyInfo = await SurveyManager.publishSurveyProps(id, langsDeleted, tx)
    this.incrementProcessedItems()

    await ActivityLog.log(this.getUser(), id, ActivityLog.type.surveyPublish, { surveyUuid: Survey.getUuid(surveyInfo) }, tx)
    this.incrementProcessedItems()
  }

}

SurveyPropsPublishJob.type = 'SurveyPropsPublishJob'

module.exports = SurveyPropsPublishJob