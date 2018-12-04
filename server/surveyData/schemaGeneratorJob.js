const R = require('ramda')
const db = require('../db/db')
const Job = require('../job/job')

const SurveyManager = require('../survey/surveyManager')
const Survey = require('../../common/survey/survey')
const NodeDef = require('../../common/survey/nodeDef')
const DataSchema = require('./dataSchema')

class SchemaGeneratorJob extends Job {

  constructor (params) {
    super(SchemaGeneratorJob.type, params)
  }

  async execute () {
    const {surveyId} = this.params
    const survey = await this.getSurvey()

    const nodeDefs = R.pipe(
      Survey.getNodeDefs,
      R.values,
      R.filter(nodeDef => NodeDef.isNodeDefEntity(nodeDef) || NodeDef.isNodeDefMultiple(nodeDef))
    )(survey)

    this.total = 2 + nodeDefs.length

    await DataSchema.dropSchema(surveyId)
    this.incrementProcessedItems()

    await DataSchema.createSchema(surveyId)
    this.incrementProcessedItems()

    for (const nodeDef of nodeDefs) {
      await DataSchema.createNodeDefTable(surveyId, nodeDef)
      this.incrementProcessedItems()
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