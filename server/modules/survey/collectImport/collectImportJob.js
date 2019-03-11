const Job = require('../../../job/job')

const SurveySchemaReaderJob = require('./metaImportJobs/surveySchemaReaderJob')
const SurveyCreatorJob = require('./metaImportJobs/surveyCreatorJob')
const CategoriesImportJob = require('./metaImportJobs/categoriesImportJob')
const TaxonomiesImportJob = require('./metaImportJobs/taxonomiesImportJob')
const NodeDefsImportJob = require('./metaImportJobs/nodeDefsImportJob')
const RecordsImportJob = require('./dataImportJobs/recordsImportJob')

class CollectImportJob extends Job {

  constructor (params) {
    super(CollectImportJob.type, params, [
      new SurveySchemaReaderJob(params),
      new SurveyCreatorJob(params),
      new CategoriesImportJob(params),
      new TaxonomiesImportJob(params),
      new NodeDefsImportJob(params),
      new RecordsImportJob(params)
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
