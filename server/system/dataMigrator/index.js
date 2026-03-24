import { ServiceType } from '@openforis/arena-core'

import * as CategoryService from '@server/modules/category/service/categoryService'

const defaultAppVersion = '2.0.0'

const isCategoryItemsMigrationNeeded = (versionInDb) => versionInDb === defaultAppVersion

const migrateCategoryItemsIfNeeded = async ({ logger, versionInDb }) => {
  if (isCategoryItemsMigrationNeeded(versionInDb)) {
    await CategoryService.initializeAllSurveysCategoryItemIndexes()
  } else {
    logger.info(`Category item indexes already initialized. App version in DB: ${versionInDb}`)
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
