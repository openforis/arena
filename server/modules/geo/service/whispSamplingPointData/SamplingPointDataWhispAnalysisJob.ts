import * as readline from 'node:readline'
import { Readable } from 'node:stream'

import { Points } from '@openforis/arena-core'

import { FileFormats } from '@core/fileFormats'
import SystemError from '@core/systemError'
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
import { WhispColumn, WhispColumnsCollector, WhispFeature, WhispValues, whispExternalIdProp } from './whispResultsUtils'

// max number of features submitted to Whisp in a single analysis request
const whispBatchSize = 1000
// long analyses: poll less frequently, to stay within the Whisp API rate limit
const pollingPeriod = 10000

const locationColumnNames = CategoryExportFile.geometryPointColumnsSuffixes.map(
  (suffix: string) => `${Category.locationItemExtraDefName}${suffix}`
)

// point-free Ramda getters in extraPropDef.js are not inferred as callable by allowJs
const ExtraPropDef: any = ExtraPropDefUntyped

type FlatRow = Record<string, any>

// line of the Whisp values temp file: index of the sampling point data row and its Whisp values
type WhispValuesLine = [number, WhispValues]

// sampling points with a location, stored in flat arrays of numbers to keep the memory usage low
type SamplingPoints = {
  rowIndexes: number[]
  // longitude and latitude of every point, one after the other
  coordinates: number[]
}

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
    // sampling point data kept in a temp file and read one row at a time, to keep the memory usage low
    const samplingPointDataFilePath = FileUtils.newTempFilePath()
    // Whisp values stored in a temp file (one line per sampling point)
    const whispValuesFilePath = FileUtils.newTempFilePath()
    try {
      await this.exportSamplingPointData({ survey, category, filePath: samplingPointDataFilePath })
      const { headers, points } = await SamplingPointDataWhispAnalysisJob.readSamplingPoints({
        filePath: samplingPointDataFilePath,
        srsIndex,
      })
      if (points.rowIndexes.length === 0) {
        throw new SystemError('geoWhispSamplingPointDataLocationsMissing')
      }
      await FileUtils.writeFile(whispValuesFilePath)
      const columnsCollector = await this.runWhispAnalysis({ points, whispValuesFilePath })
      if (this.isCanceled()) return

      await this.writeWhispCategoryFile({
        category,
        headers,
        samplingPointDataFilePath,
        columnsCollector,
        whispValuesFilePath,
      })
    } finally {
      await SamplingPointDataWhispAnalysisJob.deleteFileIfExists(samplingPointDataFilePath)
      await SamplingPointDataWhispAnalysisJob.deleteFileIfExists(whispValuesFilePath)
    }
    this.incrementProcessedItems()
  }

  static async deleteFileIfExists(filePath: string) {
    if (FileUtils.exists(filePath)) {
      await FileUtils.deleteFileAsync(filePath)
    }
  }

  async writeWhispCategoryFile({
    category,
    headers,
    samplingPointDataFilePath,
    columnsCollector,
    whispValuesFilePath,
  }: {
    category: any
    headers: string[]
    samplingPointDataFilePath: string
    columnsCollector: WhispColumnsCollector
    whispValuesFilePath: string
  }) {
    const extraPropNames = Category.getItemExtraDefKeys(category) as string[]
    const whispColumns = columnsCollector.getColumns({ existingColumnNames: [...headers, ...extraPropNames] })
    const whispCategoryFilePath = FileUtils.newTempFilePath()
    await FlatDataWriter.writeItemsStreamToStream({
      stream: Readable.from(
        SamplingPointDataWhispAnalysisJob.generateCombinedRows({
          samplingPointDataFilePath,
          whispColumns,
          whispValuesFilePath,
        })
      ),
      outputStream: FileUtils.createWriteStream(whispCategoryFilePath),
      fields: [...headers, ...whispColumns.map(({ column }) => column)],
      options: undefined,
      fileFormat: FileFormats.csv,
    })
    // keep the data type of the numeric sampling point data extra props too
    const numericExtraPropNames = Category.getItemExtraDefsArray(category)
      .filter((extraDef: any) => ExtraPropDef.getDataType(extraDef) === ExtraPropDef.dataTypes.number)
      .map((extraDef: any) => ExtraPropDef.getName(extraDef))
    this.setContext({
      whispCategoryFilePath,
      numericColumns: [...numericExtraPropNames, ...columnsCollector.getNumericColumns(whispColumns)],
    })
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

  async exportSamplingPointData({ survey, category, filePath }: { survey: any; category: any; filePath: string }) {
    await CategoryManager.exportCategoryToStream(
      {
        survey,
        categoryUuid: Category.getUuid(category),
        draft: true,
        outputStream: FileUtils.createWriteStream(filePath),
        fileFormat: FileFormats.csv,
      },
      this.tx
    )
  }

  // only the location of the sampling points is kept in memory, not the whole rows
  static async readSamplingPoints({
    filePath,
    srsIndex,
  }: {
    filePath: string
    srsIndex: any
  }): Promise<{ headers: string[]; points: SamplingPoints }> {
    let headers: string[] = []
    const points: SamplingPoints = { rowIndexes: [], coordinates: [] }
    let rowIndex = 0
    const rows = FlatDataReader.generateRowsFromFile({
      filePath,
      fileFormat: FileFormats.csv,
      onHeaders: (headersRead: string[]) => {
        headers = headersRead
      },
    })
    for await (const row of rows) {
      const pointLatLong = SamplingPointDataWhispAnalysisJob.toLatLong({ row, srsIndex })
      if (pointLatLong) {
        points.rowIndexes.push(rowIndex)
        points.coordinates.push(pointLatLong.x, pointLatLong.y)
      }
      rowIndex++
    }
    return { headers, points }
  }

  static toLatLong({ row, srsIndex }: { row: FlatRow; srsIndex: any }) {
    const [x, y, srs] = locationColumnNames.map((columnName: string) => row[columnName])
    if (!x || !y || !srs) return null

    const point = Points.parse({ x: Number(x), y: Number(y), srs })
    return point ? Points.toLatLong(point, srsIndex) : null
  }

  // features built only when submitting a batch; the row index is used as id preserved by Whisp
  static buildBatchFeatures({
    points,
    start,
    end,
  }: {
    points: SamplingPoints
    start: number
    end: number
  }): SamplingPointFeature[] {
    const features: SamplingPointFeature[] = []
    for (let index = start; index < end; index++) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [points.coordinates[index * 2], points.coordinates[index * 2 + 1]] },
        properties: { [whispExternalIdProp]: String(points.rowIndexes[index]) },
      })
    }
    return features
  }

  async runWhispAnalysis({
    points,
    whispValuesFilePath,
  }: {
    points: SamplingPoints
    whispValuesFilePath: string
  }): Promise<WhispColumnsCollector> {
    const pointsCount = points.rowIndexes.length
    // +1: writing of the output file
    this.total = Math.ceil(pointsCount / whispBatchSize) + 1

    const columnsCollector = new WhispColumnsCollector()
    for (let start = 0; start < pointsCount; start += whispBatchSize) {
      if (this.isCanceled()) break

      const batch = SamplingPointDataWhispAnalysisJob.buildBatchFeatures({
        points,
        start,
        end: Math.min(start + whispBatchSize, pointsCount),
      })
      // batches processed sequentially, to stay within the Whisp API rate limit
      await this.processBatch({ batch, columnsCollector, whispValuesFilePath }) // NOSONAR
      this.incrementProcessedItems()
    }
    return columnsCollector
  }

  // in its own function: the Whisp response of a batch can be garbage collected before requesting the next one
  async processBatch({
    batch,
    columnsCollector,
    whispValuesFilePath,
  }: {
    batch: SamplingPointFeature[]
    columnsCollector: WhispColumnsCollector
    whispValuesFilePath: string
  }) {
    const geojson = { type: 'FeatureCollection', features: batch }
    const analysisOptions = { externalIdColumn: whispExternalIdProp }
    const { data } = await WhishDataProcessor.generateData({ geojson, analysisOptions, pollingPeriod })
    const lines = SamplingPointDataWhispAnalysisJob.toWhispValuesLines({
      whispFeatures: data?.features ?? [],
      columnsCollector,
    })
    await FileUtils.appendFile(whispValuesFilePath, lines.map((line) => `${JSON.stringify(line)}\n`).join(''))
  }

  // keeps only the Whisp values to store in the category, sorted by sampling point data row index
  static toWhispValuesLines({
    whispFeatures,
    columnsCollector,
  }: {
    whispFeatures: WhispFeature[]
    columnsCollector: WhispColumnsCollector
  }): WhispValuesLine[] {
    const valuesByRowIndex = new Map<number, WhispValues>()
    for (const whispFeature of whispFeatures) {
      const rowIndex = SamplingPointDataWhispAnalysisJob.parseRowIndex(whispFeature.properties?.[whispExternalIdProp])
      if (rowIndex === null) continue

      valuesByRowIndex.set(rowIndex, columnsCollector.addFeature(whispFeature))
    }
    return [...valuesByRowIndex.entries()].sort(([rowIndexA], [rowIndexB]) => rowIndexA - rowIndexB)
  }

  static parseRowIndex(externalId: unknown): number | null {
    if (typeof externalId !== 'string' && typeof externalId !== 'number') return null
    const rowIndex = Number(externalId)
    return Number.isInteger(rowIndex) && rowIndex >= 0 ? rowIndex : null
  }

  // sampling point data rows combined with their Whisp values (both sorted by row index), read one line at a time
  static async *generateCombinedRows({
    samplingPointDataFilePath,
    whispColumns,
    whispValuesFilePath,
  }: {
    samplingPointDataFilePath: string
    whispColumns: WhispColumn[]
    whispValuesFilePath: string
  }): AsyncGenerator<FlatRow> {
    const linesReader = readline.createInterface({
      input: FileUtils.createReadStream(whispValuesFilePath),
      crlfDelay: Infinity,
    })
    const linesIterator = linesReader[Symbol.asyncIterator]()
    const readNextLine = async (): Promise<WhispValuesLine | null> => {
      const { value, done } = await linesIterator.next()
      return done ? null : JSON.parse(value)
    }
    try {
      let line = await readNextLine()
      let rowIndex = 0
      const rows = FlatDataReader.generateRowsFromFile({
        filePath: samplingPointDataFilePath,
        fileFormat: FileFormats.csv,
      })
      for await (const row of rows) {
        if (line?.[0] === rowIndex) {
          const whispValues = line[1]
          for (const { prop, column } of whispColumns) {
            row[column] = whispValues[prop] ?? ''
          }
          line = await readNextLine() // NOSONAR
        }
        yield row
        rowIndex++
      }
    } finally {
      linesReader.close()
    }
  }
}
