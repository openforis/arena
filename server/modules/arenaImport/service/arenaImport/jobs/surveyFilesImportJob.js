import * as Survey from '@core/survey/survey'
import * as SurveyBranding from '@core/survey/surveyBranding'
import * as SurveyFile from '@core/survey/surveyFile'

import * as ArenaSurveyFileZip from '../model/arenaSurveyFileZip'
import { FileImportBaseJob } from './filesImportBaseJob'

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

    // Branding descriptors uploaded before size/name were added to BrandingImageDescriptor only
    // ever stored a fileUuid, so SurveyBranding.getBrandingFileSummaries falls back to size: 0
    // for those. Resolve real sizes for any summary still missing one (from the zip content)
    // before the quota pre-check, so it sees real byte counts instead of silently treating
    // legacy branding files as zero-sized. Summaries that already carry a real size (newly
    // uploaded branding files, or preloadedMapLayerFiles/surveyDocImageFiles) are left untouched.
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

        if (!fileContent && !skipMissingFiles) {
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
