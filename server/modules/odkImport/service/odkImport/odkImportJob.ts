import Job from '@server/job/job'
import * as FileUtils from '@server/utils/file/fileUtils'
import PrepareImportFileJob from '@server/modules/file/service/prepareImportFileJob'
import SurveyDependencyGraphsGenerationJob from '@server/modules/survey/service/surveyDependencyGraphsGenerationJob'
import SurveyRdbCreationJob from '@server/modules/surveyRdb/service/surveyRdbCreationJob'
import { SurveyCreatorJobHelper } from '@server/modules/survey/service/surveyCreatorJobHelper'

import OdkFormReaderJob from './metaImportJobs/odkFormReaderJob'
import SurveyCreatorJob from './metaImportJobs/surveyCreatorJob'
import CategoriesImportJob from './metaImportJobs/categoriesImportJob'
import NodeDefsImportJob from './metaImportJobs/nodeDefsImportJob'

// Phase 0 scope: form/schema import only (no expression conversion, no data import yet - see
// docs/superpowers/specs/2026-09-09-odk-import-design.md). Mirrors collectImport's CollectImportJob.
const createInnerJobs = () => [
  new PrepareImportFileJob(),
  new OdkFormReaderJob(),
  new SurveyCreatorJob(),
  new CategoriesImportJob(),
  new NodeDefsImportJob(),
  new SurveyDependencyGraphsGenerationJob(),
  new SurveyRdbCreationJob(),
]

export default class OdkImportJob extends Job {
  static readonly type = 'OdkImportJob'

  constructor(params?: any) {
    super(OdkImportJob.type, params, createInnerJobs())
  }

  async beforeSuccess() {
    const context: any = this.context
    this.setResult({ surveyId: context.surveyId } as any)
  }

  async onEnd() {
    await super.onEnd()

    const context: any = this.context
    const { filePath, surveyId } = context

    if (surveyId) {
      await SurveyCreatorJobHelper.onJobEnd({ job: this, surveyId })
    }
    if (filePath) {
      await FileUtils.deleteFileAsync(filePath)
    }
  }
}
