const Job = require('../../../job/job')

const Survey = require('../../../../core/survey/survey')
const NodeDef = require('../../../../core/survey/nodeDef')
const SurveyManager = require('../../survey/manager/surveyManager')

const SurveyRdbManager = require('../manager/surveyRdbManager')

class SurveyRdbGeneratorJob extends Job {

  constructor (params) {
    super(SurveyRdbGeneratorJob.type, params)
  }

  async execute (tx) {

    const survey = await this.fetchSurvey(tx)
    const surveyId = Survey.getId(survey)

    //get entities or multiple attributes tables
    const { root, length } = Survey.getHierarchy(NodeDef.isEntityOrMultiple)(survey)

    this.total = 1 + length

    this.logDebug('drop and create schema - start')

    //1 ==== drop and create schema
    await SurveyRdbManager.dropSchema(surveyId, tx)
    await SurveyRdbManager.createSchema(surveyId, tx)
    this.incrementProcessedItems()
    this.logDebug('drop and create schema - end')

    //2 ==== traverse entities to create and populate tables
    const traverseNodeDef = async nodeDef => {
      if (this.isCanceled())
        return

      const nodeDefName = NodeDef.getName(nodeDef)

      // ===== create table
      this.logDebug(`create data table ${nodeDefName} - start`)
      await SurveyRdbManager.createTableAndView(survey, nodeDef, tx)
      // await tx.none(`ALTER TABLE ${SchemaRdb.getName(surveyId)}.${NodeDefTable.getTableName(nodeDef, nodeDefParent)} DISABLE TRIGGER ALL`)
      this.logDebug(`create data table ${nodeDefName} - end`)

      // ===== insert into table
      this.logDebug(`insert into table ${nodeDefName} - start`)
      await SurveyRdbManager.populateTable(survey, nodeDef, tx)
      this.logDebug(`insert into table ${nodeDefName} - end`)

      this.incrementProcessedItems()
    }

    await Survey.traverseHierarchyItem(root, traverseNodeDef)
  }

  async fetchSurvey (tx) {
    const surveySummary = await SurveyManager.fetchSurveyById(this.surveyId, true, false, tx)
    const surveyInfo = Survey.getSurveyInfo(surveySummary)
    const fetchDraft = Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)

    return await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(this.surveyId, null, fetchDraft, false, false, false, tx)
  }

}

SurveyRdbGeneratorJob.type = 'SurveyRdbGeneratorJob'

module.exports = SurveyRdbGeneratorJob