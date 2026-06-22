import { ServiceType, Versions } from '@openforis/arena-core'

import * as CategoryService from '@server/modules/category/service/categoryService'
import * as SurveyFileService from '@server/modules/survey/service/surveyFileService'

const versionWithCategoryItemIndexFix = '2.3.20'
const versionWithNewFilePathFormat = '2.5.6'

const isCategoryItemsMigrationNeeded = (versionInDb) =>
  Versions.isLessThan(versionInDb, versionWithCategoryItemIndexFix)

const isFilePathMigrationNeeded = (versionInDb) => Versions.isLessThan(versionInDb, versionWithNewFilePathFormat)

const migrateCategoryItemsIfNeeded = async ({ logger, versionInDb }) => {
  if (isCategoryItemsMigrationNeeded(versionInDb)) {
    await CategoryService.initializeAllSurveysCategoryItemIndexes()
  } else {
    logger.info(`Category item indexes already initialized/fixed. App version in DB: ${versionInDb}`)
  }
}

const migrateFilePathsIfNeeded = async ({ logger, versionInDb }) => {
  if (isFilePathMigrationNeeded(versionInDb)) {
    await SurveyFileService.migrateAllSurveysFilesToNewPathFormat({ logger })
  } else {
    logger.info(`File path format already migrated. App version in DB: ${versionInDb}`)
  }
}

const migrateData = async ({ logger, serviceRegistry }) => {
  const infoService = serviceRegistry.getService(ServiceType.info)
  const versionInDb = await infoService.getVersion()
  await migrateCategoryItemsIfNeeded({ logger, versionInDb })
  await migrateFilePathsIfNeeded({ logger, versionInDb })
}

export const DataMigrator = {
  migrateData,
}
