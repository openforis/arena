import { Points } from '@openforis/arena-core'

import { FileFormats } from '@core/fileFormats'
import SystemError from '@core/systemError'
import { uuidv4 } from '@core/uuid'
import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import { CategoryExportFile } from '@core/survey/categoryExportFile'
import { ExtraPropDef as ExtraPropDefUntyped } from '@core/survey/extraPropDef'

import Job from '@server/job/job'
import * as FileUtils from '@server/utils/file/fileUtils'
import * as FlatDataReader from '@server/utils/file/flatDataReader'
import * as FlatDataWriter from '@server/utils/file/flatDataWriter'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'

import { WhishDataProcessor } from '../whishDataProcessor'
import {
  WhispColumn,
  WhispFeature,
  extractWhispColumns,
  findNumericColumns,
  toCellValue,
  toChunks,
  whispExternalIdProp,
} from './whispResultsUtils'

// max number of features submitted to Whisp in a single analysis request
const whispBatchSize = 1000
// long analyses: poll less frequently, to stay within the Whisp API rate limit
const whispPollingPeriod = 10000

const locationColumnNames = CategoryExportFile.geometryPointColumnsSuffixes.map(
  (suffix: string) => `${Category.locationItemExtraDefName}${suffix}`
)

// point-free Ramda getters in extraPropDef.js are not inferred as callable by allowJs
const ExtraPropDef: any = ExtraPropDefUntyped

type FlatRow = Record<string, any>

type SamplingPointFeature = {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: { [whispExternalIdProp]: string }
}

/**
 * Runs the Whisp analysis on every sampling point data item having a location and writes
 * a flat data (CSV) file with the sampling point data combined with the Whisp results.
 * The file path is stored in the job context (whispCategoryFilePath), with the names of the numeric columns.
 */
export default class SamplingPointDataWhispAnalysisJob extends Job {
  static readonly type = 'SamplingPointDataWhispAnalysisJob'

  constructor(params?: any) {
    super(SamplingPointDataWhispAnalysisJob.type, params)
  }

  async execute() {
    const { surveyId } = this.context as any
    const survey = await SurveyManager.fetchSurveyById({ surveyId, draft: true }, this.tx)
    const srsIndex = Survey.getSRSIndex(Survey.getSurveyInfo(survey))

    const category = await this.fetchSamplingPointDataCategory()
    const { headers, rows } = await this.readSamplingPointData({ survey, category })

    const { features, rowIndexByExternalId } = SamplingPointDataWhispAnalysisJob.buildFeatures({ rows, srsIndex })
    if (features.length === 0) {
      throw new SystemError('geoWhispSamplingPointDataLocationsMissing')
    }
    const whispFeatures = await this.runWhispAnalysis({ features })
    if (this.isCanceled()) return

    const extraPropNames = Category.getItemExtraDefKeys(category) as string[]
    const whispColumns = extractWhispColumns({
      features: whispFeatures,
      existingColumnNames: [...headers, ...extraPropNames],
    })
    SamplingPointDataWhispAnalysisJob.assocWhispValuesToRows({
      rows,
      whispFeatures,
      whispColumns,
      rowIndexByExternalId,
    })
    const whispCategoryFilePath = FileUtils.newTempFilePath()
    await FlatDataWriter.writeItemsToStream({
      outputStream: FileUtils.createWriteStream(whispCategoryFilePath),
      items: rows,
      fields: [...headers, ...whispColumns.map(({ column }) => column)],
      fileFormat: FileFormats.csv,
    })
    // keep the data type of the numeric sampling point data extra props too
    const numericExtraPropNames = Category.getItemExtraDefsArray(category)
      .filter((extraDef: any) => ExtraPropDef.getDataType(extraDef) === ExtraPropDef.dataTypes.number)
      .map((extraDef: any) => ExtraPropDef.getName(extraDef))
    this.setContext({
      whispCategoryFilePath,
      numericColumns: [
        ...numericExtraPropNames,
        ...findNumericColumns({ columns: whispColumns, features: whispFeatures }),
      ],
    })
    this.incrementProcessedItems()
  }

  async fetchSamplingPointDataCategory() {
    const { surveyId } = this.context as any
    const categories = await CategoryManager.fetchCategoriesAndLevelsBySurveyId({ surveyId, draft: true }, this.tx)
    const category = Object.values(categories ?? {}).find(Category.isSamplingPointDataCategory)
    if (!category) {
      throw new SystemError('geoWhispSamplingPointDataCategoryMissing')
    }
    return category
  }

  async readSamplingPointData({
    survey,
    category,
  }: {
    survey: any
    category: any
  }): Promise<{ headers: string[]; rows: FlatRow[] }> {
    const exportFilePath = FileUtils.newTempFilePath()
    try {
      await CategoryManager.exportCategoryToStream(
        {
          survey,
          categoryUuid: Category.getUuid(category),
          draft: true,
          outputStream: FileUtils.createWriteStream(exportFilePath),
          fileFormat: FileFormats.csv,
        },
        this.tx
      )
      let headers: string[] = []
      const rows: FlatRow[] = []
      const reader = FlatDataReader.createReaderFromFile({
        filePath: exportFilePath,
        fileFormat: FileFormats.csv,
        onHeaders: async (headersRead: string[]) => {
          headers = headersRead
        },
        onRow: async (row: FlatRow) => {
          rows.push({ ...row })
        },
      })
      await reader.start()
      return { headers, rows }
    } finally {
      await FileUtils.deleteFileAsync(exportFilePath)
    }
  }

  static buildFeatures({ rows, srsIndex }: { rows: FlatRow[]; srsIndex: any }) {
    const features: SamplingPointFeature[] = []
    const rowIndexByExternalId: Record<string, number> = {}
    for (const [rowIndex, row] of rows.entries()) {
      const [x, y, srs] = locationColumnNames.map((columnName: string) => row[columnName])
      if (!x || !y || !srs) continue

      const point = Points.parse({ x: Number(x), y: Number(y), srs })
      const pointLatLong = point ? Points.toLatLong(point, srsIndex) : null
      if (!pointLatLong) continue

      // id preserved by Whisp, used to join its results back to the sampling points
      const externalId = uuidv4()
      rowIndexByExternalId[externalId] = rowIndex
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [pointLatLong.x, pointLatLong.y] },
        properties: { [whispExternalIdProp]: externalId },
      })
    }
    return { features, rowIndexByExternalId }
  }

  async runWhispAnalysis({ features }: { features: SamplingPointFeature[] }): Promise<WhispFeature[]> {
    const batches = toChunks(features, whispBatchSize)
    // +1: writing of the output file
    this.total = batches.length + 1

    const whispFeatures: WhispFeature[] = []
    for (const batch of batches) {
      if (this.isCanceled()) break

      const { data } = await WhishDataProcessor.generateData({
        geojson: { type: 'FeatureCollection', features: batch },
        analysisOptions: { externalIdColumn: whispExternalIdProp },
        pollingPeriod: whispPollingPeriod,
      })
      whispFeatures.push(...(data?.features ?? []))
      this.incrementProcessedItems()
    }
    return whispFeatures
  }

  static assocWhispValuesToRows({
    rows,
    whispFeatures,
    whispColumns,
    rowIndexByExternalId,
  }: {
    rows: FlatRow[]
    whispFeatures: WhispFeature[]
    whispColumns: WhispColumn[]
    rowIndexByExternalId: Record<string, number>
  }) {
    for (const whispFeature of whispFeatures) {
      const properties = whispFeature.properties ?? {}
      const rowIndex = rowIndexByExternalId[String(properties[whispExternalIdProp])]
      const row = rows[rowIndex]
      if (!row) continue

      for (const { prop, column } of whispColumns) {
        row[column] = toCellValue(properties[prop])
      }
    }
  }
}
