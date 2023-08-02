import * as R from 'ramda'

import ArenaImportJob from '@server/modules/arenaImport/service/arenaImport/arenaImportJob'
import ArenaMobileDataImportJob from '@server/modules/mobile/service/arenaMobileDataImport/arenaMobileDataImportJob'
import CategoriesExportJob from '@server/modules/category/service/CategoriesExportJob'
import CategoryImportJob from '@server/modules/category/service/categoryImportJob'
import CollectImportJob from '@server/modules/collectImport/service/collectImport/collectImportJob'
import CollectDataImportJob from '@server/modules/collectImport/service/collectImport/collectDataImportJob'
import DataImportJob from '@server/modules/dataImport/service/DataImportJob'
import DataImportValidationJob from '@server/modules/dataImport/service/DataImportValidationJob'
import ExportCsvDataJob from '@server/modules/survey/service/export/exportCsvDataJob'
import RecordsCloneJob from '@server/modules/record/service/recordsCloneJob'
import SurveyPublishJob from '@server/modules/survey/service/publish/surveyPublishJob'
import SurveyCloneJob from '@server/modules/survey/service/clone/surveyCloneJob'
import SurveyExportJob from '@server/modules/survey/service/surveyExport/surveyExportJob'
import SurveysRdbRefreshJob from '@server/modules/surveyRdb/service/SurveysRdbRefreshJob'
import TaxonomyImportJob from '@server/modules/taxonomy/service/taxonomyImportJob'

const jobClasses = [
  ArenaImportJob,
  ArenaMobileDataImportJob,
  CategoriesExportJob,
  CategoryImportJob,
  CollectImportJob,
  CollectDataImportJob,
  DataImportJob,
  DataImportValidationJob,
  ExportCsvDataJob,
  RecordsCloneJob,
  SurveyPublishJob,
  SurveyCloneJob,
  SurveyExportJob,
  SurveysRdbRefreshJob,
  TaxonomyImportJob,
]

const getJobClass = (jobType) => R.find(R.propEq('type', jobType), jobClasses)

export const createJob = (jobType, params) => {
  const JobClass = getJobClass(jobType)

  return new JobClass(params)
}
