const Job = require('../../../job/job')

const SurveyManager = require('../persistence/surveyManager')
const NodeDefManager = require('../../nodeDef/persistence/nodeDefManager')
const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const RecordManager = require('../../record/persistence/recordManager')

const SurveyRdbManager = require('../../surveyRdb/persistence/surveyRdbManager')

class SurveyRdbGeneratorJob extends Job {

  constructor (params) {
    super(SurveyRdbGeneratorJob.type, params)
  }

  async execute (tx) {
    const { surveyId } = this.params
    const survey = await this.getSurvey(tx)

    //get entities or multiple attributes tables
    const { root, length } = Survey.getHierarchy(NodeDef.isNodeDefEntityOrMultiple)(survey)
    const recordUuids = await RecordManager.fetchRecordUuids(surveyId, tx)

    this.total = 1 + length + (recordUuids.length * length)

    //1 ==== drop and create schema
    await SurveyRdbManager.dropSchema(surveyId, tx)
    await SurveyRdbManager.createSchema(surveyId, tx)
    this.incrementProcessedItems()

    //2 ==== create data tables
    const createTable = async nodeDef => {
      await SurveyRdbManager.createTable(survey, nodeDef, tx)
      this.incrementProcessedItems()
    }
    await Survey.traverseHierarchyItem(root, createTable)

    //3 ==== insert records
    const insertIntoTable = record => async (nodeDef) => {
      await SurveyRdbManager.insertIntoTable(survey, nodeDef, record, tx)
      this.incrementProcessedItems()
    }
    for (const recordUuid of recordUuids) {
      const record = await RecordManager.fetchRecordAndNodesByUuid(surveyId, recordUuid, tx)
      await Survey.traverseHierarchyItem(root, insertIntoTable(record))
    }
  }

  async getSurvey (tx) {
    const { surveyId } = this.params
    const survey = await SurveyManager.fetchSurveyById(surveyId, false, false, tx)
    const nodeDefs = await NodeDefManager.fetchNodeDefsBySurveyId(surveyId, false, false, false, tx)

    return { ...survey, nodeDefs }
  }

}

SurveyRdbGeneratorJob.type = 'SurveyRdbGeneratorJob'

module.exports = SurveyRdbGeneratorJob