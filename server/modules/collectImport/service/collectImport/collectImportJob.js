const Job = require('../../../../job/job')

const SurveyManager = require('../../../survey/manager/surveyManager')

const CollectSurveyReaderJob = require('./metaImportJobs/collectSurveyReaderJob')
const SurveyCreatorJob = require('./metaImportJobs/surveyCreatorJob')
const CategoriesImportJob = require('./metaImportJobs/categoriesImportJob')
const TaxonomiesImportJob = require('./metaImportJobs/taxonomiesImportJob')
const SamplingPointDataImportJob = require('./metaImportJobs/samplingPointDataImportJob')
const NodeDefsImportJob = require('./metaImportJobs/nodeDefsImportJob')
const SurveyDependencyGraphsGenerationJob = require('../../../survey/service/surveyDependencyGraphsGenerationJob')

const RecordsImportJob = require('./dataImportJobs/recordsImportJob')
const RecordsUniquenessValidationJob = require('./dataImportJobs/recordsUniquenessValidationJob')
const SurveyRdbGeneratorJob = require('../../../surveyRdb/service/surveyRdbGeneratorJob')

class CollectImportJob extends Job {

  constructor (params) {
    super(CollectImportJob.type, params, [
      new CollectSurveyReaderJob(),
      new SurveyCreatorJob(),
      new CategoriesImportJob(),
      new TaxonomiesImportJob(),
      new SamplingPointDataImportJob(),
      new NodeDefsImportJob(),
      new SurveyDependencyGraphsGenerationJob(),
      new RecordsImportJob(),
      new SurveyRdbGeneratorJob(),
      new RecordsUniquenessValidationJob(),
    ])
  }

  async beforeSuccess () {
    const { surveyId } = this.context

    this.setResult({
      surveyId
    })
  }

  async onEnd () {
    await super.onEnd()

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
