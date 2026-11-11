import Job from '@server/job/job'
import * as FileUtils from '@server/utils/file/fileUtils'
import { CategoryValidationJob } from '@server/modules/category/service/CategoryValidationJob'

import SamplingPointDataWhispAnalysisJob from './SamplingPointDataWhispAnalysisJob'
import SamplingPointDataWhispCategoryImportJob from './SamplingPointDataWhispCategoryImportJob'

/**
 * Generates the Whisp analysis for all the sampling point data items and stores it,
 * combined with the sampling point data, in the "sampling_point_data_whisp" category.
 */
export default class SamplingPointDataWhispJob extends Job {
  static readonly type = 'SamplingPointDataWhispJob'

  constructor(params?: any) {
    super(SamplingPointDataWhispJob.type, params, [
      new SamplingPointDataWhispAnalysisJob(params),
      new SamplingPointDataWhispCategoryImportJob(params),
      new CategoryValidationJob(params),
    ])
  }

  async beforeEnd() {
    await super.beforeEnd()
    const { whispCategoryFilePath } = this.context as any
    if (whispCategoryFilePath && FileUtils.exists(whispCategoryFilePath)) {
      await FileUtils.deleteFileAsync(whispCategoryFilePath)
    }
  }

  generateResult(): Promise<any> {
    const { category } = this.context as any
    return Promise.resolve({ category })
  }
}
