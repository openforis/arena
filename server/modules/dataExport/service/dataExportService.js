import * as JobManager from '@server/job/jobManager'
import DataExportJob from '@server/modules/dataExport/service/DataExportJob'

export const startCsvDataExportJob = ({
  user,
  surveyId,
  cycle,
  recordUuids,
  search,
  includeCategories,
  includeCategoryItemsLabels,
  expandCategoryItems,
  includeAncestorAttributes,
  includeAnalysis,
  includeDataFromAllCycles,
  includeFiles,
  recordsModifiedAfter,
}) => {
  const job = new DataExportJob({
    user,
    surveyId,
    cycle,
    recordUuids,
    search,
    includeCategories,
    includeCategoryItemsLabels,
    expandCategoryItems,
    includeAncestorAttributes,
    includeAnalysis,
    includeDataFromAllCycles,
    includeFiles,
    recordsModifiedAfter,
  })

  JobManager.executeJobThread(job)

  return job
}
