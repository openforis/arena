import { GeoPackageAPI, GeometryColumns, FeatureColumn, GeometryType, GeoPackageDataType } from '@ngageoint/geopackage'
import type { GeoPackage } from '@ngageoint/geopackage'

import * as ProcessUtils from '@core/processUtils'
import { uuidv4 } from '@core/uuid'
import { FileFormats, getExtensionByFileFormat } from '@core/fileFormats'
import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import { ExtraPropDef as ExtraPropDefUntyped } from '@core/survey/extraPropDef'
import { CategoryExportFile } from '@core/survey/categoryExportFile'

import Job from '@server/job/job'
import * as FileUtils from '@server/utils/file/fileUtils'
import * as DbUtils from '@server/db/dbUtils'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as CategoryRepository from '../repository/categoryRepository'
import * as CategoryExportRepository from '../repository/categoryExportRepository'
import { buildCategoryItemFeature } from '../manager/categoryGeoPackageFeatureBuilder'

// extraPropDef.js's getName/getDataType are point-free Ramda compositions (e.g. A.prop(...)),
// which allowJs's lightweight JS inference (checkJs is off project-wide) can't resolve to real
// function types - it falls back to {}, making ExtraPropDef.getName(...) look "not callable"
const ExtraPropDef: any = ExtraPropDefUntyped

const locationExtraPropName = Category.locationItemExtraDefName
const geometryColumnName = 'geom'
const idColumnName = 'id'

const sanitizeTableName = (name: string): string => (name || 'category').replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 63)

/**
 * Exports the items of a category into a GeoPackage file (one feature table, Point geometries).
 * Only leaf level items are exported; items without a valid 'location' extra property are skipped
 * and counted in the job result (skippedItems) instead of making the whole export fail.
 */
export default class CategoryGeoPackageExportJob extends Job {
  static readonly type = 'CategoryGeoPackageExportJob'

  geoPackage: GeoPackage | null
  skippedItems: number

  constructor(params?: any) {
    super(CategoryGeoPackageExportJob.type, params)
    this.geoPackage = null
    this.skippedItems = 0
  }

  /**
   * Builds the feature table columns: primary key, geometry, code, labels/descriptions per language
   * and one (or 3, for geometry point extra defs) column per non-location extra property definition.
   */
  static buildFeatureColumns({ category, languages }: { category: Record<string, any>; languages: string[] }) {
    const extraDefs = Category.getItemExtraDefsArray(category).filter(
      (extraDef: any) => ExtraPropDef.getName(extraDef) !== locationExtraPropName
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
      ...extraDefs.flatMap((extraDef: any) => {
        const dataType = ExtraPropDef.getDataType(extraDef)
        return CategoryExportFile.getExtraPropHeaders({ extraPropDef: extraDef }).map((header: string) =>
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
    const context: any = this.context
    const { surveyId, categoryUuid, draft } = context

    const survey = await SurveyManager.fetchSurveyById({ surveyId, draft }, this.tx)
    const surveyInfo = Survey.getSurveyInfo(survey)
    const category = await CategoryRepository.fetchCategoryAndLevelsByUuid({ surveyId, categoryUuid, draft }, this.tx)
    const srsIndex = Survey.getSRSIndex(surveyInfo)
    // cast: Survey.getLanguages is a destructured re-export (survey.js: `export const { ..., getLanguages,
    // ... } = SurveyInfo`), which allowJs's lightweight JS inference resolves to {} instead of string[]
    const languages = Survey.getLanguages(surveyInfo) as string[]
    const levels = Category.getLevelsArray(category)
    const leafLevelIndex = levels.length - 1

    // JobBase.total defaults to 1 (meant for jobs with no inner jobs and a single unit of work),
    // so it must be set here or progressPercent (100 * processed / total) blows past 100% the
    // moment more than one leaf item is processed
    this.total = await CategoryRepository.countItemsByLevelIndex(
      { surveyId, categoryUuid, levelIndex: leafLevelIndex },
      this.tx
    )

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
      processor: async (dbStream: any) =>
        new Promise<void>((resolve, reject) => {
          dbStream.on('data', (row: Record<string, any>) => {
            try {
              // export only leaf level items
              if (row.level_index !== leafLevelIndex) return
              const feature = buildCategoryItemFeature({ category, row, languages, srsIndex })
              if (feature) {
                geoPackage.addGeoJSONFeatureToGeoPackage(feature, tableName)
              } else {
                this.skippedItems += 1
              }
              // increment for every leaf item visited (exported or skipped), matching this.total,
              // so progress reaches exactly 100% even when some items are skipped
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

  // return type widened to Promise<any>: JobBase.generateResult() is declared Promise<R | undefined>
  // with R defaulting to undefined (Job, the untyped JS parent, never specializes it), so a concrete
  // object literal return type would fail the override-compatibility check against Promise<undefined>
  async generateResult(): Promise<any> {
    const { tempFileName } = this.context as any
    return { tempFileName, skippedItems: this.skippedItems }
  }
}
