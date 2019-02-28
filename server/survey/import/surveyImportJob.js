const Job = require('../../job/job')

const SurveySchemaReaderJob = require('./helpers/surveySchemaReaderJob')
const SurveyCreatorJob = require('./helpers/surveyCreatorJob')
const CategoriesImportJob = require('./helpers/categoriesImportJob')
const TaxonomiesImportJob = require('./helpers/taxonomiesImportJob')
const SchemaImportJob = require('./helpers/schemaImportJob')

class SurveyImportJob extends Job {
  constructor (params) {
    super(SurveyImportJob.type, params, [
      new SurveySchemaReaderJob(params),
      new SurveyCreatorJob(params),
      new CategoriesImportJob(params),
      new TaxonomiesImportJob(params),
      new SchemaImportJob(params)
    ])
  }
}

SurveyImportJob.type = 'SurveyImportJob'

module.exports = SurveyImportJob
