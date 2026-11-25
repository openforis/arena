import Job, { type JobParams } from '@server/job/job'
import PrepareImportFileJob from '@server/modules/file/service/prepareImportFileJob'
import RecordCheckJob from '@server/modules/survey/service/recordCheckJob'
import { SurveyCreatorJobHelper } from '@server/modules/survey/service/surveyCreatorJobHelper'
import SurveyDependencyGraphsGenerationJob from '@server/modules/survey/service/surveyDependencyGraphsGenerationJob'
import SurveyRdbCreationJob from '@server/modules/surveyRdb/service/surveyRdbCreationJob'
import * as FileUtils from '@server/utils/file/fileUtils'

import RecordsImportJob from './dataImportJobs/recordsImportJob'
import CategoriesImportJob from './metaImportJobs/categoriesImportJob'
import CollectSurveyReaderJob from './metaImportJobs/collectSurveyReaderJob'
import NodeDefsImportJob from './metaImportJobs/nodeDefsImportJob/nodeDefsImportJob'
import SamplingPointDataImportJob from './metaImportJobs/samplingPointDataImportJob'
import SurveyCreatorJob from './metaImportJobs/surveyCreatorJob'
import TaxonomiesImportJob from './metaImportJobs/taxonomiesImportJob'

const createInnerJob = (params: Partial<JobParams>) => {
  const { options = {} } = params
  const { includeData = true } = options

  return [
    new PrepareImportFileJob(),
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
  static readonly type = 'CollectImportJob'

  constructor(params?: Partial<JobParams>) {
    super(CollectImportJob.type, params, createInnerJob(params))
  }

  beforeSuccess() {
    const { surveyId } = this.context

    this.setResult({
      surveyId,
    })
    return Promise.resolve()
  }

  async onEnd() {
    await super.onEnd()

    const { collectSurveyFileZip, filePath, surveyId } = this.context

    if (collectSurveyFileZip) {
      collectSurveyFileZip.close()
    }

    if (surveyId) {
      await SurveyCreatorJobHelper.onJobEnd({ job: this, surveyId })
    }

    if (filePath) {
      await FileUtils.deleteFileAsync(filePath)
    }
  }
}
