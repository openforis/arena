import * as ObjectUtils from '@core/objectUtils'
import PersistOlapDataJob from '@server/modules/analysis/service/olap/persistOlapDataJob'
import PersistResultsJob from '@server/modules/analysis/service/rChain/persistResultsJob'
import ArenaImportJob from '@server/modules/arenaImport/service/arenaImport/arenaImportJob'
import CategoriesBatchImportJob from '@server/modules/category/service/categoriesBatchImportJob'
import CategoriesExportJob from '@server/modules/category/service/categoriesExportJob'
import CategoryGeoPackageExportJob from '@server/modules/category/service/categoryGeoPackageExportJob'
import CategoryImportJob from '@server/modules/category/service/categoryImportJob'
import CollectDataImportJob from '@server/modules/collectImport/service/collectImport/collectDataImportJob'
import CollectImportJob from '@server/modules/collectImport/service/collectImport/collectImportJob'
import DataExportJob from '@server/modules/dataExport/service/dataExportJob'
import DataMatrixExportJob from '@server/modules/dataExport/service/dataMatrixExportJob'
import DataSummaryExportJob from '@server/modules/dataExport/service/dataSummaryExportJob'
import DataImportJob from '@server/modules/dataImport/service/dataImportJob'
import DataImportValidationJob from '@server/modules/dataImport/service/dataImportValidationJob'
import { GeoJsonDataExportJob } from '@server/modules/geo/service/geoJsonDataExportJob'
import SamplingPointDataWhispJob from '@server/modules/geo/service/whispSamplingPointData/samplingPointDataWhispJob'
import MessageSendJob from '@server/modules/message/service/messageSendJob'
import ArenaMobileDataImportJob from '@server/modules/mobile/service/arenaMobileDataImport/arenaMobileDataImportJob'
import ArenaMobileDataImportSummaryJob from '@server/modules/mobile/service/arenaMobileDataImport/arenaMobileDataImportSummaryJob'
import OdkDataImportJob from '@server/modules/odkImport/service/odkImport/odkDataImportJob'
import OdkImportJob from '@server/modules/odkImport/service/odkImport/odkImportJob'
import RecordsCloneJob from '@server/modules/record/service/recordsCloneJob'
import RecordsValidationJob from '@server/modules/record/service/recordsValidationJob'
import SelectedRecordsExportJob from '@server/modules/record/service/selectedRecordsExportJob'
import VaidationReportGenerationJob from '@server/modules/record/service/validationReportGenerationJob'
import SurveyCloneJob from '@server/modules/survey/service/clone/surveyCloneJob'
import AllSurveysDataMigrationJob from '@server/modules/survey/service/dataMigration/allSurveysDataMigrationJob'
import SurveyPublishJob from '@server/modules/survey/service/publish/surveyPublishJob'
import SchemaSummaryExportJob from '@server/modules/survey/service/schemaSummary/schemaSummaryExportJob'
import SurveyActivityLogClearJob from '@server/modules/survey/service/surveyActivityLogClearJob'
import SurveyCreatorJob from '@server/modules/survey/service/surveyCreateJob'
import SurveyExportJob from '@server/modules/survey/service/surveyExport/surveyExportJob'
import SurveyLabelsImportJob from '@server/modules/survey/service/surveyLabelsImportJob'
import SurveysListExportJob from '@server/modules/survey/service/surveysListExportJob'
import SurveyUnpublishJob from '@server/modules/survey/service/unpublish/surveyUnpublishJob'
import SurveyCompareApplyJob from '@server/modules/surveyCompare/service/surveyCompareApplyJob'
import SurveyCompareJob from '@server/modules/surveyCompare/service/surveyCompareJob'
import SurveysRdbRefreshJob from '@server/modules/surveyRdb/service/surveysRdbRefreshJob'
import TaxonomyImportJob from '@server/modules/taxonomy/service/taxonomyImportJob'
import UsersBackupExportJob from '@server/modules/user/service/usersBackup/usersBackupExportJob'
import UsersBackupImportJob from '@server/modules/user/service/usersBackup/usersBackupImportJob'

const jobClasses = [
  AllSurveysDataMigrationJob,
  ArenaImportJob,
  ArenaMobileDataImportJob,
  ArenaMobileDataImportSummaryJob,
  CategoriesExportJob,
  CategoriesBatchImportJob,
  CategoryGeoPackageExportJob,
  CategoryImportJob,
  CollectImportJob,
  CollectDataImportJob,
  DataImportJob,
  DataImportValidationJob,
  DataExportJob,
  DataMatrixExportJob,
  DataSummaryExportJob,
  GeoJsonDataExportJob,
  MessageSendJob,
  OdkImportJob,
  OdkDataImportJob,
  PersistOlapDataJob,
  PersistResultsJob,
  RecordsCloneJob,
  RecordsValidationJob,
  SamplingPointDataWhispJob,
  SelectedRecordsExportJob,
  SurveyCloneJob,
  SurveyCompareJob,
  SurveyCompareApplyJob,
  SurveyActivityLogClearJob,
  SurveyCreatorJob,
  SurveyExportJob,
  SurveyLabelsImportJob,
  SurveyPublishJob,
  SchemaSummaryExportJob,
  SurveysListExportJob,
  SurveysRdbRefreshJob,
  SurveyUnpublishJob,
  TaxonomyImportJob,
  UsersBackupExportJob,
  UsersBackupImportJob,
  VaidationReportGenerationJob,
]

const jobClassesByType = ObjectUtils.toIndexedObj(jobClasses, 'type')

export const createJob = (jobType: string, params: Record<string, any>, jobUuid?: string | null) => {
  const JobClass = jobClassesByType[jobType] as any
  const job = new JobClass(params)
  if (jobUuid) {
    job.uuid = jobUuid
    job.initLogger()
  }
  return job
}
