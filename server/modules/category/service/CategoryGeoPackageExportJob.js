import { GeoPackageAPI, GeometryColumns, FeatureColumn, GeometryType, GeoPackageDataType } from '@ngageoint/geopackage'

import * as ProcessUtils from '@core/processUtils'
import { uuidv4 } from '@core/uuid'
import { FileFormats, getExtensionByFileFormat } from '@core/fileFormats'
import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import { CategoryExportFile } from '@core/survey/categoryExportFile'

import Job from '@server/job/job'
import * as FileUtils from '@server/utils/file/fileUtils'
import * as DbUtils from '@server/db/dbUtils'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as CategoryRepository from '../repository/categoryRepository'
import * as CategoryExportRepository from '../repository/categoryExportRepository'
import { buildCategoryItemFeature } from '../manager/categoryGeoPackageFeatureBuilder'

const locationExtraPropName = Category.locationItemExtraDefName
const geometryColumnName = 'geom'
const idColumnName = 'id'

const sanitizeTableName = (name) => (name || 'category').replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 63)

/**
 * Exports the items of a category into a GeoPackage file (one feature table, Point geometries).
 * Only leaf level items are exported; items without a valid 'location' extra property are skipped
 * and counted in the job result (skippedItems) instead of making the whole export fail.
 */
export default class CategoryGeoPackageExportJob extends Job {
  constructor(params) {
    super(CategoryGeoPackageExportJob.type, params)
    this.geoPackage = null
    this.skippedItems = 0
  }

  /**
   * Builds the feature table columns: primary key, geometry, code, labels/descriptions per language
   * and one (or 3, for geometry point extra defs) column per non-location extra property definition.
   * @param {!object} params - The parameters object.
   * @param {!object} params.category - The category being exported.
   * @param {!string[]} params.languages - The survey languages.
   * @returns {Array} The feature columns.
   */
  static buildFeatureColumns({ category, languages }) {
    const extraDefs = Category.getItemExtraDefsArray(category).filter(
      (extraDef) => ExtraPropDef.getName(extraDef) !== locationExtraPropName
    )
    let columnIndex = 0
    return [
      FeatureColumn.createPrimaryKeyColumn(columnIndex++, idColumnName),
      FeatureColumn.createGeometryColumn(columnIndex++, geometryColumnName, GeometryType.POINT, false, null),
      FeatureColumn.createColumn(columnIndex++, 'code', GeoPackageDataType.TEXT),
      ...languages.flatMap((language) => [
        FeatureColumn.createColumn(columnIndex++, `label_${language}`, GeoPackageDataType.TEXT),
        FeatureColumn.createColumn(columnIndex++, `description_${language}`, GeoPackageDataType.TEXT),
      ]),
      ...extraDefs.flatMap((extraDef) => {
        const dataType = ExtraPropDef.getDataType(extraDef)
        return CategoryExportFile.getExtraPropHeaders({ extraPropDef: extraDef }).map((header) =>
          FeatureColumn.createColumn(
            columnIndex++,
            header,
            dataType === ExtraPropDef.dataTypes.number ? GeoPackageDataType.REAL : GeoPackageDataType.TEXT
          )
        )
      }),
    ]
  }

  async execute() {
    const { surveyId, categoryUuid, draft } = this.context

    const survey = await SurveyManager.fetchSurveyById({ surveyId, draft }, this.tx)
    const surveyInfo = Survey.getSurveyInfo(survey)
    const category = await CategoryRepository.fetchCategoryAndLevelsByUuid({ surveyId, categoryUuid, draft }, this.tx)
    const srsIndex = Survey.getSRSIndex(surveyInfo)
    const languages = Survey.getLanguages(surveyInfo)
    const levels = Category.getLevelsArray(category)
    const leafLevelIndex = levels.length - 1

    const tableName = sanitizeTableName(Category.getName(category))
    // GeoPackageAPI.create validates the file extension: it only accepts '.gpkg' / '.gpkx',
    // so the default temp file name (<uuid>.tmp) cannot be used here.
    // FileUtils.checkIsValidTempFileName only checks the base name is a uuid, so this is still a valid temp file name.
    const tempFileName = `${uuidv4()}.${getExtensionByFileFormat(FileFormats.gpkg)}`
    const tempFilePath = FileUtils.tempFilePath(tempFileName)
    this.setContext({ tempFileName })

    await FileUtils.mkdir(ProcessUtils.ENV.tempFolder)

    const geoPackage = await GeoPackageAPI.create(tempFilePath)
    this.geoPackage = geoPackage

    const geometryColumns = new GeometryColumns()
    geometryColumns.table_name = tableName
    geometryColumns.column_name = geometryColumnName
    geometryColumns.geometry_type_name = 'POINT'
    geometryColumns.z = 0
    geometryColumns.m = 0

    // default boundingBox / srsId params of createFeatureTable are whole-world / EPSG:4326,
    // which is exactly the SRS every point is reprojected into by buildCategoryItemFeature
    geoPackage.createFeatureTable(
      tableName,
      geometryColumns,
      CategoryGeoPackageExportJob.buildFeatureColumns({ category, languages })
    )

    const queryStream = CategoryExportRepository.generateCategoryExportStream({
      surveyId,
      category,
      languages,
      draft,
    })

    await DbUtils.stream({
      client: this.tx,
      queryStream,
      processor: async (dbStream) =>
        new Promise((resolve, reject) => {
          dbStream.on('data', (row) => {
            try {
              // export only leaf level items
              if (row.level_index !== leafLevelIndex) return
              const feature = buildCategoryItemFeature({ category, row, languages, srsIndex })
              if (!feature) {
                this.skippedItems += 1
                return
              }
              geoPackage.addGeoJSONFeatureToGeoPackage(feature, tableName)
              this.incrementProcessedItems()
            } catch (error) {
              reject(error)
            }
          })
          dbStream.on('end', resolve)
          dbStream.on('error', reject)
        }),
    })

    this.closeGeoPackage()
  }

  closeGeoPackage() {
    if (this.geoPackage) {
      this.geoPackage.close()
      this.geoPackage = null
    }
  }

  async beforeEnd() {
    await super.beforeEnd()
    // close the GeoPackage also when execute() failed, to avoid leaking an open file handle
    this.closeGeoPackage()
  }

  async generateResult() {
    const { tempFileName } = this.context
    return { tempFileName, skippedItems: this.skippedItems }
  }
}

CategoryGeoPackageExportJob.type = 'CategoryGeoPackageExportJob'
