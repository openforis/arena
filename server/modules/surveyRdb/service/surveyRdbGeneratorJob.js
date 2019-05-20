const Job = require('../../../job/job')

const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const SurveyManager = require('../../survey/manager/surveyManager')
const RecordManager = require('../../record/manager/recordManager')

const SurveyRdbManager = require('../manager/surveyRdbManager')

class SurveyRdbGeneratorJob extends Job {

  constructor (params) {
    super(SurveyRdbGeneratorJob.type, params)
  }

  async execute (tx) {
    //TODO put survey in context in SurveyPublishJob
    const survey = await this.fetchSurvey(tx)
    const surveyId = Survey.getId(survey)

    //get entities or multiple attributes tables
    const { root, length } = Survey.getHierarchy(NodeDef.isEntityOrMultiple)(survey)
    const recordUuids = await RecordManager.fetchRecordUuids(surveyId, tx)

    this.total = 1 + length + (recordUuids.length * length)

    this.logDebug('drop and create schema - start')
    //1 ==== drop and create schema
    await SurveyRdbManager.dropSchema(surveyId, tx)
    await SurveyRdbManager.createSchema(surveyId, tx)
    this.incrementProcessedItems()
    this.logDebug('drop and create schema - end')

    this.logDebug('create data tables - start')
    //2 ==== create data tables
    const createTable = async nodeDef => {
      await SurveyRdbManager.createTable(survey, nodeDef, tx)
      this.incrementProcessedItems()
    }
    await Survey.traverseHierarchyItem(root, createTable)
    this.logDebug('create data tables - end')

    //3 ==== insert records
    const insertIntoTable = record =>
      async nodeDef => {
        await SurveyRdbManager.insertIntoTable(survey, nodeDef, record, tx)
        this.incrementProcessedItems()
      }

    for (const recordUuid of recordUuids) {
      if (this.isCanceled())
        return

      this.logDebug(`insert record ${recordUuid} - start`)
      const record = await RecordManager.fetchRecordAndNodesByUuid(surveyId, recordUuid, tx)
      await Survey.traverseHierarchyItem(root, insertIntoTable(record))
      this.logDebug(`insert record ${recordUuid} - end`)
    }
  }

  async fetchSurvey (tx) {
    const surveyId = this.getSurveyId()

    const surveySummary = await SurveyManager.fetchSurveyById(surveyId, true, false, tx)
    const surveyInfo = Survey.getSurveyInfo(surveySummary)
    const fetchDraft = Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)

    return await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(surveyId, fetchDraft, false, false, tx)
  }

}

SurveyRdbGeneratorJob.type = 'SurveyRdbGeneratorJob'

module.exports = SurveyRdbGeneratorJob