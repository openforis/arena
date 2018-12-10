const Job = require('../../job/job')

const SurveyManager = require('../surveyManager')
const NodeDefManager = require('../../nodeDef/nodeDefManager')
const Survey = require('../../../common/survey/survey')
const NodeDef = require('../../../common/survey/nodeDef')
const RecordManager = require('../../record/recordManager')

const SurveyRdbManager = require('../../surveyRdb/surveyRdbManager')

class SurveyRdbGeneratorJob extends Job {

  constructor (params) {
    super(SurveyRdbGeneratorJob.type, params)
  }

  async execute () {
    const {surveyId} = this.params
    const survey = await this.getSurvey()

    //get entities or multiple attributes tables
    const {root, length} = Survey.getHierarchy(NodeDef.isNodeDefEntityOrMultiple)(survey)
    const {records: recordSummaries} = await RecordManager.fetchRecordsSummaryBySurveyId(surveyId, 0)

    this.total = 1 + length + (recordSummaries.length * length)

    //1 ==== drop and create schema
    await SurveyRdbManager.dropSchema(surveyId)
    await SurveyRdbManager.createSchema(surveyId)
    this.incrementProcessedItems()

    //2 ==== create data tables
    const createTable = async nodeDef => {
      await SurveyRdbManager.createTable(survey, nodeDef)
      this.incrementProcessedItems()
    }
    await Survey.traverseHierarchyItem(root, createTable)

    //3 ==== insert records
    const insertIntoTable = record => async (nodeDef) => {
      await SurveyRdbManager.insertIntoTable(survey, nodeDef, record)
      this.incrementProcessedItems()
    }
    for (const recordSummary of recordSummaries) {
      const record = await RecordManager.fetchRecordByUuid(surveyId, recordSummary.uuid)
      await Survey.traverseHierarchyItem(root, insertIntoTable(record))
    }

    this.setStatusSucceeded()
  }

  async getSurvey () {
    const {surveyId} = this.params
    const survey = await SurveyManager.fetchSurveyById(surveyId)
    const nodeDefs = await NodeDefManager.fetchNodeDefsBySurveyId(surveyId)

    return {...survey, nodeDefs}
  }

}

SurveyRdbGeneratorJob.type = 'SchemaGeneratorJob'

module.exports = SurveyRdbGeneratorJob