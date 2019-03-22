const Job = require('../../../../job/job')

const SurveyManager = require('../../persistence/surveyManager')

const CollectSurveyReaderJob = require('./metaImportJobs/collectSurveyReaderJob')
const SurveyCreatorJob = require('./metaImportJobs/surveyCreatorJob')
const CategoriesImportJob = require('./metaImportJobs/categoriesImportJob')
const TaxonomiesImportJob = require('./metaImportJobs/taxonomiesImportJob')
const NodeDefsImportJob = require('./metaImportJobs/nodeDefsImportJob')
const RecordsImportJob = require('./dataImportJobs/recordsImportJob')
const SurveyPropsPublishJob = require('../publish/jobs/surveyPropsPublishJob')
const SurveyDependencyGraphsGenerationJob = require('../publish/jobs/surveyDependencyGraphsGenerationJob')
const SurveyRdbGeneratorJob = require('../publish/jobs/surveyRdbGeneratorJob')
const RecordCheckJob = require('../publish/jobs/recordCheckJob')

class CollectImportJob extends Job {

  constructor (params) {
    super(CollectImportJob.type, params, [
      new CollectSurveyReaderJob(),
      new SurveyCreatorJob(),
      new CategoriesImportJob(),
      new TaxonomiesImportJob(),
      new NodeDefsImportJob(),
      //publish survey
      new SurveyPropsPublishJob(),
      new SurveyDependencyGraphsGenerationJob(),
      //import records
      new RecordsImportJob(),
      new RecordCheckJob(),
      //generate RDB
      new SurveyRdbGeneratorJob(),
    ])
  }

  async setStatusSucceeded() {
    const { surveyId } = this.context

    this.setResult({
      surveyId
    })
    await super.setStatusSucceeded()
  }

  async onEnd () {
    const { collectSurveyFileZip, surveyId } = this.context

    if (collectSurveyFileZip)
      collectSurveyFileZip.close()

    if (!this.isSucceeded() && surveyId) {
      await SurveyManager.dropSurveySchema(surveyId)
    }
  }
}

CollectImportJob.type = 'CollectImportJob'

module.exports = CollectImportJob
