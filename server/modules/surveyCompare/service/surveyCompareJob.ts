import * as Survey from '@core/survey/survey'
import { compareSurveys } from '@core/survey/surveyCompare'

import Job from '@server/job/job'
import PrepareImportFileJob from '@server/modules/file/service/prepareImportFileJob'
import * as FileUtils from '@server/utils/file/fileUtils'

import { SurveyCompareSourceRef, keepFile, keepJson, withSource } from './surveyCompareSource'
import { fetchSurveyFromDb } from './surveyCompareSurveysReader'
import { computeSurveyFingerprint } from './surveyFingerprintService'

/**
 * Compares the source survey (uploaded file or another survey on this server) with the survey with the specified id.
 * The uploaded file and the result are kept in the shared temp storage, so they can be used later on any server
 * instance (e.g. to apply the changes).
 */
class SurveyCompareDiffJob extends Job {
  static readonly type = 'SurveyCompareDiffJob'

  constructor(params?: any) {
    super(SurveyCompareDiffJob.type, params)
  }

  async getSourceRef(): Promise<SurveyCompareSourceRef> {
    const { filePath, sourceFileId, sourceSurveyId }: any = this.context
    if (sourceSurveyId) return { sourceSurveyId: Number(sourceSurveyId) }
    if (sourceFileId) return { sourceFileId }
    // the uploaded file is moved into the shared temp storage
    return { sourceFileId: await keepFile({ filePath }) }
  }

  async execute() {
    const { surveyId, manualMatches = {} }: any = this.context
    const sourceRef = await this.getSourceRef()
    const result = await withSource(
      sourceRef,
      async (source) => {
        const target = await fetchSurveyFromDb({ surveyId }, this.tx)
        const sourceSurveyInfo = Survey.getSurveyInfo(source.survey)
        return {
          ...compareSurveys({
            sourceSurvey: source.survey,
            targetSurvey: target.survey,
            sourceItemsByCategoryUuid: source.itemsByCategoryUuid,
            targetItemsByCategoryUuid: target.itemsByCategoryUuid,
            sourceTaxaByTaxonomyUuid: source.taxaByTaxonomyUuid,
            targetTaxaByTaxonomyUuid: target.taxaByTaxonomyUuid,
            manualMatches,
          }),
          source: {
            name: Survey.getName(sourceSurveyInfo),
            labels: Survey.getLabels(sourceSurveyInfo),
            fingerprint: computeSurveyFingerprint(source),
          },
          target: { fingerprint: computeSurveyFingerprint(target) },
        }
      },
      this.tx
    )
    const resultFileId = await keepJson(result)
    this.setContext({ ...sourceRef, resultFileId })
  }
}

export default class SurveyCompareJob extends Job {
  static readonly type = 'SurveyCompareJob'

  /**
   * Creates the job.
   * @param {object} params - The parameters.
   * @param {object} params.user - The user running the job.
   * @param {number} params.surveyId - Id of the survey to compare (target).
   * @param {string} [params.filePath] - Path of the uploaded survey file (source).
   * @param {string} [params.sourceFileId] - Id of a survey file uploaded before, kept in the temp storage (source).
   * @param {number} [params.sourceSurveyId] - Id of another survey on this server (source).
   * @param {Record<string, string>} [params.manualMatches] - Node defs matched by the user (target uuid by source uuid).
   */
  constructor(params?: any) {
    super(SurveyCompareJob.type, params, [new PrepareImportFileJob(), new SurveyCompareDiffJob()])
  }

  generateResult(): Promise<any> {
    const { sourceFileId, sourceSurveyId, resultFileId }: any = this.context
    return Promise.resolve({ sourceFileId, sourceSurveyId, resultFileId })
  }

  async onEnd() {
    await super.onEnd()
    // the uploaded file is left only if the job failed before keeping it
    const { filePath }: any = this.context
    if (filePath && FileUtils.exists(filePath)) {
      await FileUtils.deleteFileAsync(filePath)
    }
  }
}
