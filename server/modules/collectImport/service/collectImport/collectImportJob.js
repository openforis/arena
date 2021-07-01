import Job from '@server/job/job'

import SurveyDependencyGraphsGenerationJob from '@server/modules/survey/service/surveyDependencyGraphsGenerationJob'
import SurveyRdbCreationJob from '@server/modules/surveyRdb/service/surveyRdbCreationJob'
import RecordCheckJob from '@server/modules/survey/service/recordCheckJob'
import UserPreferredSurveyUpdateJob from '@server/modules/user/service/userPreferredSurveyUpdateJob'

import * as SurveyManager from '../../../survey/manager/surveyManager'

import CollectSurveyReaderJob from './metaImportJobs/collectSurveyReaderJob'
import SurveyCreatorJob from './metaImportJobs/surveyCreatorJob'
import CategoriesImportJob from './metaImportJobs/categoriesImportJob'
import TaxonomiesImportJob from './metaImportJobs/taxonomiesImportJob'
import SamplingPointDataImportJob from './metaImportJobs/samplingPointDataImportJob'
import NodeDefsImportJob from './metaImportJobs/nodeDefsImportJob/nodeDefsImportJob'
import RecordsImportJob from './dataImportJobs/recordsImportJob'

export default class CollectImportJob extends Job {
  constructor(params) {
    super(CollectImportJob.type, params, [
      new CollectSurveyReaderJob(),
      new SurveyCreatorJob(),
      new CategoriesImportJob(),
      new TaxonomiesImportJob(),
      new SamplingPointDataImportJob(),
      new NodeDefsImportJob(),
      new SurveyDependencyGraphsGenerationJob(),
      new RecordsImportJob(),
      new RecordCheckJob(),
      new SurveyRdbCreationJob(),
      new UserPreferredSurveyUpdateJob(),
    ])
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

    if (!this.isSucceeded() && surveyId) {
      this.logDebug(`dropping schema for survey ${surveyId}...`)
      await SurveyManager.dropSurveySchema(surveyId)
      this.logDebug(`dropping schema for survey ${surveyId} complete!`)
    }
  }
}

CollectImportJob.type = 'CollectImportJob'
