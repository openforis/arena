import Job, { type JobParams } from '@server/job/job'
import { CategoryValidationJob } from '@server/modules/category/service/categoryValidationJob'
import * as FileUtils from '@server/utils/file/fileUtils'

import SamplingPointDataWhispAnalysisJob from './samplingPointDataWhispAnalysisJob'
import SamplingPointDataWhispCategoryImportJob from './samplingPointDataWhispCategoryImportJob'
import type { SamplingPointDataWhispJobContext } from './samplingPointDataWhispJobContext'

/**
 * Generates the Whisp analysis for all the sampling point data items and stores it,
 * combined with the sampling point data, in the "sampling_point_data_whisp" category.
 */
export default class SamplingPointDataWhispJob extends Job<SamplingPointDataWhispJobContext> {
  static readonly type = 'SamplingPointDataWhispJob'

  constructor(params?: Partial<JobParams>) {
    super(SamplingPointDataWhispJob.type, params, [
      new SamplingPointDataWhispAnalysisJob(params),
      new SamplingPointDataWhispCategoryImportJob(params),
      new CategoryValidationJob(params),
    ])
  }

  async beforeEnd() {
    await super.beforeEnd()
    const { whispCategoryFilePath } = this.context
    if (whispCategoryFilePath && FileUtils.exists(whispCategoryFilePath)) {
      await FileUtils.deleteFileAsync(whispCategoryFilePath)
    }
  }

  generateResult(): Promise<Record<string, unknown>> {
    const { category } = this.context
    return Promise.resolve({ category })
  }
}
