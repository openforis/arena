import * as ObjectUtils from '@core/objectUtils'

import ArenaImportJob from '@server/modules/arenaImport/service/arenaImport/arenaImportJob'
import ArenaMobileDataImportJob from '@server/modules/mobile/service/arenaMobileDataImport/arenaMobileDataImportJob'
import CategoriesExportJob from '@server/modules/category/service/CategoriesExportJob'
import CategoriesBatchImportJob from '@server/modules/category/service/CategoriesBatchImportJob'
import CategoryImportJob from '@server/modules/category/service/categoryImportJob'
import CollectImportJob from '@server/modules/collectImport/service/collectImport/collectImportJob'
import CollectDataImportJob from '@server/modules/collectImport/service/collectImport/collectDataImportJob'
import DataImportJob from '@server/modules/dataImport/service/DataImportJob'
import DataImportValidationJob from '@server/modules/dataImport/service/DataImportValidationJob'
import ExportCsvDataJob from '@server/modules/survey/service/export/exportCsvDataJob'
import RecordsCloneJob from '@server/modules/record/service/recordsCloneJob'
import SurveyCloneJob from '@server/modules/survey/service/clone/surveyCloneJob'
import SurveyExportJob from '@server/modules/survey/service/surveyExport/surveyExportJob'
import SurveyLabelsImportJob from '@server/modules/survey/service/surveyLabelsImportJob'
import SurveyPublishJob from '@server/modules/survey/service/publish/surveyPublishJob'
import SurveysRdbRefreshJob from '@server/modules/surveyRdb/service/SurveysRdbRefreshJob'
import SurveyUnpublishJob from '@server/modules/survey/service/unpublish/surveyUnpublishJob'
import TaxonomyImportJob from '@server/modules/taxonomy/service/taxonomyImportJob'

const jobClasses = [
  ArenaImportJob,
  ArenaMobileDataImportJob,
  CategoriesExportJob,
  CategoriesBatchImportJob,
  CategoryImportJob,
  CollectImportJob,
  CollectDataImportJob,
  DataImportJob,
  DataImportValidationJob,
  ExportCsvDataJob,
  RecordsCloneJob,
  SurveyCloneJob,
  SurveyExportJob,
  SurveyLabelsImportJob,
  SurveyPublishJob,
  SurveysRdbRefreshJob,
  SurveyUnpublishJob,
  TaxonomyImportJob,
]

const jobClassesByType = ObjectUtils.toIndexedObj(jobClasses, 'type')

export const createJob = (jobType, params) => {
  const JobClass = jobClassesByType[jobType]

  return new JobClass(params)
}
