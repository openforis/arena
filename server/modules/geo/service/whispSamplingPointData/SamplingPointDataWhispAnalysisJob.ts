import * as readline from 'node:readline'
import { Readable } from 'node:stream'

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
  WhispColumnsCollector,
  WhispFeature,
  WhispValues,
  toChunks,
  whispExternalIdProp,
} from './whispResultsUtils'

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
    // Whisp values stored in a temp file (one line per sampling point), to keep the memory usage low
    const whispValuesFilePath = FileUtils.newTempFilePath()
    await FileUtils.writeFile(whispValuesFilePath)
    try {
      const columnsCollector = await this.runWhispAnalysis({ features, rowIndexByExternalId, whispValuesFilePath })
      if (this.isCanceled()) return

      await this.writeWhispCategoryFile({ category, headers, rows, columnsCollector, whispValuesFilePath })
    } finally {
      await FileUtils.deleteFileAsync(whispValuesFilePath)
    }
    this.incrementProcessedItems()
  }

  async writeWhispCategoryFile({
    category,
    headers,
    rows,
    columnsCollector,
    whispValuesFilePath,
  }: {
    category: any
    headers: string[]
    rows: FlatRow[]
    columnsCollector: WhispColumnsCollector
    whispValuesFilePath: string
  }) {
    const extraPropNames = Category.getItemExtraDefKeys(category) as string[]
    const whispColumns = columnsCollector.getColumns({ existingColumnNames: [...headers, ...extraPropNames] })
    const whispCategoryFilePath = FileUtils.newTempFilePath()
    await FlatDataWriter.writeItemsStreamToStream({
      stream: Readable.from(
        SamplingPointDataWhispAnalysisJob.generateCombinedRows({ rows, whispColumns, whispValuesFilePath })
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
        onHeaders: (headersRead: string[]) => {
          headers = headersRead
        },
        onRow: (row: FlatRow) => {
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

  async runWhispAnalysis({
    features,
    rowIndexByExternalId,
    whispValuesFilePath,
  }: {
    features: SamplingPointFeature[]
    rowIndexByExternalId: Record<string, number>
    whispValuesFilePath: string
  }): Promise<WhispColumnsCollector> {
    const batches = toChunks(features, whispBatchSize)
    // +1: writing of the output file
    this.total = batches.length + 1

    const columnsCollector = new WhispColumnsCollector()
    for (const batch of batches) {
      if (this.isCanceled()) break

      // batches processed sequentially, to stay within the Whisp API rate limit
      await this.processBatch({ batch, rowIndexByExternalId, columnsCollector, whispValuesFilePath }) // NOSONAR
      this.incrementProcessedItems()
    }
    return columnsCollector
  }

  // in its own function: the Whisp response of a batch can be garbage collected before requesting the next one
  async processBatch({
    batch,
    rowIndexByExternalId,
    columnsCollector,
    whispValuesFilePath,
  }: {
    batch: SamplingPointFeature[]
    rowIndexByExternalId: Record<string, number>
    columnsCollector: WhispColumnsCollector
    whispValuesFilePath: string
  }) {
    const geojson = { type: 'FeatureCollection', features: batch }
    const analysisOptions = { externalIdColumn: whispExternalIdProp }
    const { data } = await WhishDataProcessor.generateData({ geojson, analysisOptions, pollingPeriod })
    const lines = SamplingPointDataWhispAnalysisJob.toWhispValuesLines({
      whispFeatures: data?.features ?? [],
      rowIndexByExternalId,
      columnsCollector,
    })
    await FileUtils.appendFile(whispValuesFilePath, lines.map((line) => `${JSON.stringify(line)}\n`).join(''))
  }

  // keeps only the Whisp values to store in the category, sorted by sampling point data row index
  static toWhispValuesLines({
    whispFeatures,
    rowIndexByExternalId,
    columnsCollector,
  }: {
    whispFeatures: WhispFeature[]
    rowIndexByExternalId: Record<string, number>
    columnsCollector: WhispColumnsCollector
  }): WhispValuesLine[] {
    const valuesByRowIndex = new Map<number, WhispValues>()
    for (const whispFeature of whispFeatures) {
      const externalId = whispFeature.properties?.[whispExternalIdProp]
      const rowIndex = typeof externalId === 'string' ? rowIndexByExternalId[externalId] : undefined
      if (rowIndex === undefined) continue

      valuesByRowIndex.set(rowIndex, columnsCollector.addFeature(whispFeature))
    }
    return [...valuesByRowIndex.entries()].sort(([rowIndexA], [rowIndexB]) => rowIndexA - rowIndexB)
  }

  // sampling point data rows combined with their Whisp values (both sorted by row index), read one line at a time
  static async *generateCombinedRows({
    rows,
    whispColumns,
    whispValuesFilePath,
  }: {
    rows: FlatRow[]
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
      for (const [rowIndex, row] of rows.entries()) {
        if (line?.[0] !== rowIndex) {
          yield row
          continue
        }
        const whispValues = line[1]
        const rowCombined = { ...row }
        for (const { prop, column } of whispColumns) {
          rowCombined[column] = whispValues[prop] ?? ''
        }
        yield rowCombined
        line = await readNextLine() // NOSONAR
      }
    } finally {
      linesReader.close()
    }
  }
}
