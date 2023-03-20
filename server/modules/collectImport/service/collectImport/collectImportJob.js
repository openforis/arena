import Job from '@server/job/job'

import SurveyDependencyGraphsGenerationJob from '@server/modules/survey/service/surveyDependencyGraphsGenerationJob'
import SurveyRdbCreationJob from '@server/modules/surveyRdb/service/surveyRdbCreationJob'
import RecordCheckJob from '@server/modules/survey/service/recordCheckJob'
import { SurveyCreatorJobHelper } from '@server/modules/survey/service/surveyCreatorJobHelper'

import CollectSurveyReaderJob from './metaImportJobs/collectSurveyReaderJob'
import SurveyCreatorJob from './metaImportJobs/surveyCreatorJob'
import CategoriesImportJob from './metaImportJobs/categoriesImportJob'
import TaxonomiesImportJob from './metaImportJobs/taxonomiesImportJob'
import SamplingPointDataImportJob from './metaImportJobs/samplingPointDataImportJob'
import NodeDefsImportJob from './metaImportJobs/nodeDefsImportJob/nodeDefsImportJob'
import RecordsImportJob from './dataImportJobs/recordsImportJob'

const createInnerJob = (params) => {
  const { options = {} } = params
  const { includeData = true } = options

  return [
    new CollectSurveyReaderJob(),
    new SurveyCreatorJob(),
    new CategoriesImportJob(),
    new TaxonomiesImportJob(),
    new SamplingPointDataImportJob(),
    new NodeDefsImportJob(),
    new SurveyDependencyGraphsGenerationJob(),
    ...(includeData ? [new RecordsImportJob(), new RecordCheckJob()] : []),
    new SurveyRdbCreationJob(),
  ]
}

export default class CollectImportJob extends Job {
  constructor(params) {
    super(CollectImportJob.type, params, createInnerJob(params))
  }

  async beforeSuccess() {
    const { surveyId } = this.context

    this.setResult({
      surveyId,
    })
  }

  async onEnd() {
    await super.onEnd()

    const { collectSurveyFileZip, surveyId } = this.context

    if (collectSurveyFileZip) {
      collectSurveyFileZip.close()
    }

    if (surveyId) {
      await SurveyCreatorJobHelper.onJobEnd({ job: this, surveyId })
    }
  }
}

CollectImportJob.type = 'CollectImportJob'
