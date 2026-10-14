import * as Survey from '@core/survey/survey'
import { compareSurveys } from '@core/survey/surveyCompare'

import Job from '@server/job/job'
import PrepareImportFileJob from '@server/modules/file/service/prepareImportFileJob'
import * as FileUtils from '@server/utils/file/fileUtils'

import { fetchTargetSurvey, readSurveyFromFile } from './surveyCompareSurveysReader'

/**
 * Compares the survey in the uploaded file with the survey with the specified id.
 * The uploaded file is kept as a temp file (sourceFileName) so the changes can be applied later.
 */
class SurveyCompareDiffJob extends Job {
  static readonly type = 'SurveyCompareDiffJob'

  constructor(params?: any) {
    super(SurveyCompareDiffJob.type, params)
  }

  async execute() {
    const context: any = this.context
    const { surveyId, filePath, manualMatches = {} } = context
    let { sourceFileName } = context
    if (sourceFileName) {
      FileUtils.checkIsValidTempFileName(sourceFileName)
    } else {
      sourceFileName = FileUtils.newTempFileName()
      await FileUtils.copyFile(filePath, FileUtils.tempFilePath(sourceFileName))
    }
    const source = await readSurveyFromFile({ filePath: FileUtils.tempFilePath(sourceFileName) })
    const target = await fetchTargetSurvey({ surveyId }, this.tx)
    const sourceSurvey = source.survey
    const result = compareSurveys({
      sourceSurvey,
      targetSurvey: target.survey,
      sourceItemsByCategoryUuid: source.itemsByCategoryUuid,
      targetItemsByCategoryUuid: target.itemsByCategoryUuid,
      sourceTaxaByTaxonomyUuid: source.taxaByTaxonomyUuid,
      targetTaxaByTaxonomyUuid: target.taxaByTaxonomyUuid,
      manualMatches,
    })
    const sourceSurveyInfo = Survey.getSurveyInfo(sourceSurvey)
    const resultFileName = FileUtils.newTempFileName()
    await FileUtils.writeFile(
      FileUtils.tempFilePath(resultFileName),
      JSON.stringify({
        ...result,
        source: { name: Survey.getName(sourceSurveyInfo), labels: Survey.getLabels(sourceSurveyInfo) },
      })
    )
    this.setContext({ sourceFileName, resultFileName })
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
   * @param {string} [params.sourceFileName] - Temp file name of a previously uploaded survey file (source).
   * @param {Record<string, string>} [params.manualMatches] - Node defs matched by the user (target uuid by source uuid).
   */
  constructor(params?: any) {
    super(SurveyCompareJob.type, params, [new PrepareImportFileJob(), new SurveyCompareDiffJob()])
  }

  generateResult(): Promise<any> {
    const { sourceFileName, resultFileName }: any = this.context
    return Promise.resolve({ sourceFileName, resultFileName })
  }

  async onEnd() {
    await super.onEnd()
    const { filePath }: any = this.context
    if (filePath && FileUtils.exists(filePath)) {
      await FileUtils.deleteFileAsync(filePath)
    }
  }
}
