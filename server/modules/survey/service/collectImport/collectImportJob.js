const Job = require('../../../../job/job')

const SurveySchemaReaderJob = require('./jobs/surveySchemaReaderJob')
const SurveyCreatorJob = require('./jobs/surveyCreatorJob')
const CategoriesImportJob = require('./jobs/categoriesImportJob')
const TaxonomiesImportJob = require('./jobs/taxonomiesImportJob')
const SchemaImportJob = require('./jobs/schemaImportJob')

class CollectImportJob extends Job {

  constructor (params) {
    super(CollectImportJob.type, params, [
      new SurveySchemaReaderJob(params),
      new SurveyCreatorJob(params),
      new CategoriesImportJob(params),
      new TaxonomiesImportJob(params),
      new SchemaImportJob(params)
    ])
  }

  onFinish () {
    const { collectSurveyFileZip } = this.context

    if (collectSurveyFileZip)
      collectSurveyFileZip.close()
  }

}

CollectImportJob.type = 'CollectImportJob'

module.exports = CollectImportJob
