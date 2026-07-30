import { ServiceType, Versions } from '@openforis/arena-core'

import * as CategoryService from '@server/modules/category/service/categoryService'

const versionWithCategoryItemIndexFix = '2.3.20'

const isCategoryItemsMigrationNeeded = (versionInDb) =>
  Versions.isLessThan(versionInDb, versionWithCategoryItemIndexFix)

const migrateCategoryItemsIfNeeded = async ({ logger, versionInDb }) => {
  if (isCategoryItemsMigrationNeeded(versionInDb)) {
    await CategoryService.initializeAllSurveysCategoryItemIndexes()
  } else {
    logger.info(`Category item indexes already initialized/fixed. App version in DB: ${versionInDb}`)
  }
}

const migrateData = async ({ logger, serviceRegistry }) => {
  const infoService = serviceRegistry.getService(ServiceType.info)
  const versionInDb = await infoService.getVersion()
  await migrateCategoryItemsIfNeeded({ logger, versionInDb })
}

export const DataMigrator = {
  migrateData,
}
