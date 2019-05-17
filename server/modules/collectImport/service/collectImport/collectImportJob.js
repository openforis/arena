const Job = require('../../../../job/job')

const SurveyManager = require('../../../survey/manager/surveyManager')

const CollectSurveyReaderJob = require('./metaImportJobs/collectSurveyReaderJob')
const SurveyCreatorJob = require('./metaImportJobs/surveyCreatorJob')
const CategoriesImportJob = require('./metaImportJobs/categoriesImportJob')
const TaxonomiesImportJob = require('./metaImportJobs/taxonomiesImportJob')
const NodeDefsImportJob = require('./metaImportJobs/nodeDefsImportJob')
const RecordsImportJob = require('./dataImportJobs/recordsImportJob')
const SurveyIndexGeneratorJob = require('../../../survey/service/surveyIndexGeneratorJob')
const SurveyRdbGeneratorJob = require('../../../surveyRdb/service/surveyRdbGeneratorJob')
const RecordCheckJob = require('../../../survey/service/recordCheckJob')

class CollectImportJob extends Job {

  constructor (params) {
    super(CollectImportJob.type, params, [
      new CollectSurveyReaderJob(),
      new SurveyCreatorJob(),
      new CategoriesImportJob(),
      new TaxonomiesImportJob(),
      new NodeDefsImportJob(),
      // create survey index
      new SurveyIndexGeneratorJob(),
      //import records
      new RecordsImportJob(),
      //TODO restore it after performance improvement
      // new RecordCheckJob(),
      //generate RDB
      new SurveyRdbGeneratorJob(),
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
