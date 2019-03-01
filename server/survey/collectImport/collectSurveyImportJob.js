const Job = require('../../job/job')

const SurveySchemaReaderJob = require('./jobs/surveySchemaReaderJob')
const SurveyCreatorJob = require('./jobs/surveyCreatorJob')
const CategoriesImportJob = require('./jobs/categoriesImportJob')
const TaxonomiesImportJob = require('./jobs/taxonomiesImportJob')
const SchemaImportJob = require('./jobs/schemaImportJob')

class CollectSurveyImportJob extends Job {

  constructor (params) {
    super(CollectSurveyImportJob.type, params, [
      new SurveySchemaReaderJob(params),
      new SurveyCreatorJob(params),
      new CategoriesImportJob(params),
      new TaxonomiesImportJob(params),
      new SchemaImportJob(params)
    ])
  }

}

CollectSurveyImportJob.type = 'CollectSurveyImportJob'

module.exports = CollectSurveyImportJob
