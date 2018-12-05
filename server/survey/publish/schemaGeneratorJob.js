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

    // entities or multiple attributes
    const nodeDefs = R.pipe(
      Survey.getNodeDefsArray,
      R.filter(nodeDef => NodeDef.isNodeDefEntity(nodeDef) || NodeDef.isNodeDefMultiple(nodeDef))
    )(survey)

    const {records: recordSummaries} = await RecordManager.fetchRecordsSummaryBySurveyId(surveyId, 0)

    this.total = 1 + nodeDefs.length + (recordSummaries.length * nodeDefs.length)

    await DataSchema.dropSchema(surveyId)
    await DataSchema.createSchema(surveyId)
    this.incrementProcessedItems()

    // create data tables
    for (const nodeDef of nodeDefs) {
      await DataSchema.createTable(survey, nodeDef)
      this.incrementProcessedItems()
    }

    // insert records
    for (const recordSummary of recordSummaries) {
      const record = await RecordManager.fetchRecordById(surveyId, recordSummary.id)
      for (const nodeDef of nodeDefs) {
        await DataSchema.insertIntoTable(survey, nodeDef, record)
        this.incrementProcessedItems()
      }
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