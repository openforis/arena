import * as Survey from '@core/survey/survey'
import * as SurveyBranding from '@core/survey/surveyBranding'
import * as SurveyFile from '@core/survey/surveyFile'

import * as ArenaSurveyFileZip from '../model/arenaSurveyFileZip'
import { FileImportBaseJob } from './filesImportBaseJob'

// preloadedMapLayer already existed (and was fully exported) before this feature, so a zip
// missing its content is a genuine anomaly worth failing on (unless the caller opts out via
// skipMissingFiles). surveyDocImage/branding* files are new: any zip exported before this
// feature shipped legitimately has none of them, so their absence must never be fatal —
// otherwise every pre-existing backup of a branded survey would fail to restore.
const CONTENT_REQUIRED_FILE_TYPES = new Set([SurveyFile.SurveyFileType.preloadedMapLayer])

export default class SurveyFilesImportJob extends FileImportBaseJob {
  constructor(params) {
    super('SurveyFilesImportJob', params)
  }

  async execute() {
    const { arenaSurveyFileZip, survey, surveyId, skipMissingFiles = false } = this.context

    const surveyInfo = Survey.getSurveyInfo(survey)
    const preloadedMapLayerFiles = Survey.getPreloadedMapLayers(surveyInfo)
    const surveyDocImageFiles = Survey.getSurveyDocImages(surveyInfo)
    const brandingFiles = SurveyBranding.getBrandingFileSummaries(SurveyBranding.getBranding(surveyInfo))

    const fileSummaries = [...preloadedMapLayerFiles, ...surveyDocImageFiles, ...brandingFiles]

    // Branding file summaries (Task 1's SurveyBranding.getBrandingFileSummaries) hardcode
    // props.size to 0, since the branding descriptor stored in survey props never retains the
    // real file size. Resolve real sizes for any summary missing one (from the zip content)
    // before the quota pre-check, so it sees real byte counts instead of silently treating
    // branding files as zero-sized. preloadedMapLayerFiles/surveyDocImageFiles already carry
    // accurate sizes and are left untouched.
    const fileSummariesWithSizes = await Promise.all(
      fileSummaries.map(async (fileSummary) => {
        if (SurveyFile.getSize(fileSummary)) {
          return fileSummary
        }
        const fileUuid = SurveyFile.getUuid(fileSummary)
        const content = await ArenaSurveyFileZip.getSurveyFile(arenaSurveyFileZip, fileUuid)
        return content ? SurveyFile.assocSize(Buffer.byteLength(content))(fileSummary) : fileSummary
      })
    )

    this.total = fileSummariesWithSizes.length

    if (this.total > 0) {
      this.logDebug(`survey files to import: ${this.total}`)
      await this.checkFilesNotExceedingAvailableQuota(fileSummariesWithSizes)
      for (const fileSummary of fileSummariesWithSizes) {
        if (this.isCanceled()) {
          break
        }
        let file = { ...fileSummary }

        // load file content
        const fileUuid = SurveyFile.getUuid(fileSummary)
        const fileName = SurveyFile.getName(fileSummary)
        const fileContent = await ArenaSurveyFileZip.getSurveyFile(arenaSurveyFileZip, fileUuid)
        const contentRequired = CONTENT_REQUIRED_FILE_TYPES.has(SurveyFile.getType(fileSummary))

        if (!fileContent && !skipMissingFiles && contentRequired) {
          throw new Error(`Missing content for file ${fileUuid} (${fileName})`)
        }
        if (fileContent) {
          file = SurveyFile.assocContent(fileContent)(file)

          // update file size with actual file content length
          file = SurveyFile.assocSize(Buffer.byteLength(fileContent))(file)

          await this.persistFile(file)
        } else {
          this.logWarn(`Survey ${surveyId}: missing content for survey file ${fileUuid} (${fileName})`)
        }
        this.incrementProcessedItems()
      }
    }
  }
}
