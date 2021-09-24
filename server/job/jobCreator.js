import * as R from 'ramda'

import CategoryImportJob from '@server/modules/category/service/categoryImportJob'
import CollectImportJob from '@server/modules/collectImport/service/collectImport/collectImportJob'
import CollectDataImportJob from '@server/modules/collectImport/service/collectImport/collectDataImportJob'
import SurveyPublishJob from '@server/modules/survey/service/publish/surveyPublishJob'
import ExportCsvDataJob from '@server/modules/survey/service/export/exportCsvDataJob'
import SurveyCloneJob from '@server/modules/survey/service/clone/surveyCloneJob'
import TaxonomyImportJob from '@server/modules/taxonomy/service/taxonomyImportJob'
import ArenaImportJob from '@server/modules/arenaImport/service/arenaImport/arenaImportJob'
import SurveyExportJob from '@server/modules/survey/service/surveyExport/surveyExportJob'
import SurveysRdbRefreshJob from '@server/modules/surveyRdb/service/SurveysRdbRefreshJob'

const jobClasses = [
  CategoryImportJob,
  CollectImportJob,
  CollectDataImportJob,
  SurveyPublishJob,
  ExportCsvDataJob,
  TaxonomyImportJob,
  ArenaImportJob,
  SurveyCloneJob,
  SurveyExportJob,
  SurveysRdbRefreshJob,
]

const getJobClass = (jobType) => R.find(R.propEq('type', jobType), jobClasses)

export const createJob = (jobType, params) => {
  const JobClass = getJobClass(jobType)

  return new JobClass(params)
}
