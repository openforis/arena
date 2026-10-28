import * as Survey from '@core/survey/survey'
import * as SurveyBranding from '@core/survey/surveyBranding'
import * as SurveyFile from '@core/survey/surveyFile'

export type MobilePackageFileSummary = { uuid: string; type: string; name?: string; size?: number }

const getPreloadedMapLayerFileSummaries = (surveyInfo: any): MobilePackageFileSummary[] => {
  if (!Survey.isPreloadedMapLayersEnabled(surveyInfo)) return []
  return (Survey.getPreloadedMapLayers(surveyInfo) as any[])
    .filter((file: any) => !SurveyFile.isDeleted(file))
    .map((file: any) => ({
      uuid: SurveyFile.getUuid(file),
      type: SurveyFile.SurveyFileType.preloadedMapLayer,
      name: SurveyFile.getName(file),
      size: SurveyFile.getSize(file),
    }))
}

const getBrandingFileSummaries = (surveyInfo: any): MobilePackageFileSummary[] =>
  SurveyBranding.getBrandingFileSummaries(SurveyBranding.getBranding(surveyInfo)).map(({ uuid, props }) => ({
    uuid,
    type: props.type,
    name: props.name,
    size: props.size,
  }))

/**
 * Returns the survey files to include in the Arena Mobile survey package (the ones referenced by the survey info).
 *
 * @param {object} surveyInfo - The survey info.
 * @returns {MobilePackageFileSummary[]} - Summaries of the files to include.
 */
const getFileSummaries = (surveyInfo: any): MobilePackageFileSummary[] => [
  ...getPreloadedMapLayerFileSummaries(surveyInfo),
  ...getBrandingFileSummaries(surveyInfo),
]

export const SurveyMobilePackage = { getFileSummaries }
