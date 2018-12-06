const R = require('ramda')
const Job = require('../../job/job')

const SurveyManager = require('../surveyManager')
const Survey = require('../../../common/survey/survey')
const NodeDef = require('../../../common/survey/nodeDef')
const RecordManager = require('../../record/recordManager')
const DataSchema = require('../../surveyData/dataSchema')

class SchemaGeneratorJob extends Job {

  constructor (params) {
    super(SchemaGeneratorJob.type, params)
  }

  async execute () {
    const {surveyId} = this.params
    const survey = await this.getSurvey()

    const {records: recordSummaries} = await RecordManager.fetchRecordsSummaryBySurveyId(surveyId, 0)

    // entities or multiple attributes
    const hasTable = nodeDef => NodeDef.isNodeDefEntity(nodeDef) || NodeDef.isNodeDefMultiple(nodeDef)
    const nodeDefs = R.pipe(Survey.getNodeDefsArray, R.filter(hasTable))(survey)
    const rootDef = Survey.getRootNodeDef(survey)

    this.total = 1 + nodeDefs.length + (recordSummaries.length * nodeDefs.length)

    // drop and create schema
    await DataSchema.dropSchema(surveyId)
    await DataSchema.createSchema(surveyId)
    this.incrementProcessedItems()

    const traverse = async (nodeDef, fn) => {
      await fn(nodeDef)

      const childDefs = R.pipe(Survey.getNodeDefChildren(nodeDef), R.filter(hasTable))(survey)

      for (const childDef of childDefs) {
        await traverse(childDef, fn)
      }
    }

    // create data tables
    const createTable = async nodeDef => {
      await DataSchema.createTable(survey, nodeDef)
      this.incrementProcessedItems()
    }
    await traverse(rootDef, createTable)

    // insert records
    const insertIntoTable = record => async (nodeDef) => {
      await DataSchema.insertIntoTable(survey, nodeDef, record)
      this.incrementProcessedItems()
    }

    for (const recordSummary of recordSummaries) {
      const record = await RecordManager.fetchRecordById(surveyId, recordSummary.id)
      await traverse(rootDef, insertIntoTable(record))
    }

    this.setStatusSucceeded()

  }

  async getSurvey () {
    const {surveyId} = this.params
    const survey = await SurveyManager.fetchSurveyById(surveyId)
    const nodeDefs = await SurveyManager.fetchSurveyNodeDefs(surveyId)

    return {...survey, nodeDefs}
  }

}

SchemaGeneratorJob.type = 'SchemaGeneratorJob'

module.exports = SchemaGeneratorJob