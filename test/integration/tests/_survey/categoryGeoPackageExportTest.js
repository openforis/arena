import { GeoPackageAPI } from '@ngageoint/geopackage'

import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'
import { ExtraPropDef } from '@core/survey/extraPropDef'

import * as FileUtils from '@server/utils/file/fileUtils'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import CategoryGeoPackageExportJob from '@server/modules/category/service/CategoryGeoPackageExportJob'

import { getContextSurveyId, getContextUser } from '../../config/context'

export const categoryGeoPackageExportTest = async () => {
  const surveyId = getContextSurveyId()
  const user = getContextUser()

  const categoryReq = Category.assocItemExtraDef({
    location: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.geometryPoint, index: 0, locked: true }),
  })(Category.newCategory({ name: 'category_gpkg_export_test' }))
  const category = await CategoryManager.insertCategory({ user, surveyId, category: categoryReq })
  const categoryUuid = Category.getUuid(category)
  const level = Category.getLevelByIndex(0)(category)

  await CategoryManager.insertItem(
    user,
    surveyId,
    categoryUuid,
    CategoryItem.newItem(CategoryLevel.getUuid(level), null, {
      code: '001',
      labels: { en: 'Site with location' },
      extra: { location: 'SRID=EPSG:4326;POINT(12.5 41.9)' },
    })
  )
  await CategoryManager.insertItem(
    user,
    surveyId,
    categoryUuid,
    CategoryItem.newItem(CategoryLevel.getUuid(level), null, {
      code: '002',
      labels: { en: 'Site without location' },
      extra: {},
    })
  )

  const job = new CategoryGeoPackageExportJob({ user, surveyId, categoryUuid, draft: true })
  await job.start()

  expect(job.errors).toEqual({})
  expect(job.isSucceeded()).toBe(true)
  // total must be the leaf item count (2), not JobBase's inner-jobs-less default of 1, otherwise
  // progressPercent (100 * processed / total) overshoots 100% as soon as more than one item is
  // processed; processed counts skipped items too, so it reaches total (and 100%) exactly
  expect(job.total).toBe(2)
  expect(job.processed).toBe(2)
  expect(job.calculateProgressPercent()).toBe(100)
  const { tempFileName, skippedItems } = job.result
  expect(skippedItems).toBe(1)

  const tempFilePath = FileUtils.tempFilePath(tempFileName)
  const geoPackage = await GeoPackageAPI.open(tempFilePath)
  try {
    const featureDao = geoPackage.getFeatureDao('category_gpkg_export_test')
    expect(featureDao.count()).toBe(1)

    const results = featureDao.queryForAll()
    const featureRow = featureDao.getRow(results[0])
    expect(featureRow.getValueWithColumnName('code')).toBe('001')
    expect(featureRow.getValueWithColumnName('label_en')).toBe('Site with location')
    expect(featureRow.getValueWithColumnName('description_en')).toBeNull()

    const { geometry } = featureRow.geometry
    expect(geometry.x).toBeCloseTo(12.5)
    expect(geometry.y).toBeCloseTo(41.9)
  } finally {
    geoPackage.close()
  }

  await FileUtils.deleteFileAsync(tempFilePath)
}

export const categoryGeoPackageExportHierarchicalTest = async () => {
  const surveyId = getContextSurveyId()
  const user = getContextUser()

  const categoryReq = Category.assocItemExtraDef({
    location: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.geometryPoint, index: 0, locked: true }),
  })(Category.newCategory({ name: 'category_gpkg_export_hierarchical_test' }))
  const category = await CategoryManager.insertCategory({ user, surveyId, category: categoryReq })
  const categoryUuid = Category.getUuid(category)

  const { level: level2 } = await CategoryManager.insertLevel({ user, surveyId, level: Category.newLevel(category) })
  const level1 = Category.getLevelByIndex(0)(category)

  // parent (non leaf) item: it has a valid location too, but must NOT be exported
  const { item: parentItem } = await CategoryManager.insertItem(
    user,
    surveyId,
    categoryUuid,
    CategoryItem.newItem(CategoryLevel.getUuid(level1), null, {
      code: 'P1',
      labels: { en: 'Parent' },
      extra: { location: 'SRID=EPSG:4326;POINT(1 1)' },
    })
  )
  await CategoryManager.insertItem(
    user,
    surveyId,
    categoryUuid,
    CategoryItem.newItem(CategoryLevel.getUuid(level2), CategoryItem.getUuid(parentItem), {
      code: 'C1',
      labels: { en: 'Child' },
      extra: { location: 'SRID=EPSG:4326;POINT(2 2)' },
    })
  )

  const job = new CategoryGeoPackageExportJob({ user, surveyId, categoryUuid, draft: true })
  await job.start()

  expect(job.errors).toEqual({})
  expect(job.isSucceeded()).toBe(true)
  // total must be the leaf-level item count (1), excluding the non-leaf parent
  expect(job.total).toBe(1)
  expect(job.processed).toBe(1)
  expect(job.calculateProgressPercent()).toBe(100)
  const { tempFileName, skippedItems } = job.result
  // the non-leaf parent item is filtered out, not counted as skipped
  expect(skippedItems).toBe(0)

  const tempFilePath = FileUtils.tempFilePath(tempFileName)
  const geoPackage = await GeoPackageAPI.open(tempFilePath)
  try {
    const featureDao = geoPackage.getFeatureDao('category_gpkg_export_hierarchical_test')
    expect(featureDao.count()).toBe(1)

    const results = featureDao.queryForAll()
    const featureRow = featureDao.getRow(results[0])
    expect(featureRow.getValueWithColumnName('code')).toBe('C1')
  } finally {
    geoPackage.close()
  }

  await FileUtils.deleteFileAsync(tempFilePath)
}
