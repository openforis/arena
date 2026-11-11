import * as os from 'node:os'
import * as path from 'node:path'

import { DEFAULT_SRS_INDEX } from '@openforis/arena-core'

import { uuidv4 } from '@core/uuid'

import * as FileUtils from '@server/utils/file/fileUtils'
import SamplingPointDataWhispAnalysisJob from '@server/modules/geo/service/whispSamplingPointData/SamplingPointDataWhispAnalysisJob'
import { WhispColumnsCollector } from '@server/modules/geo/service/whispSamplingPointData/whispResultsUtils'

const csvContent = [
  'level_1_code,location_x,location_y,location_srs',
  'A,10.5,5.25,4326',
  'B,,,',
  'C,-1.5,7,4326',
].join('\n')

const readAll = async <T>(generator: AsyncGenerator<T>): Promise<T[]> => {
  const items: T[] = []
  for await (const item of generator) {
    items.push(item)
  }
  return items
}

describe('SamplingPointDataWhispAnalysisJob', () => {
  const filePaths: string[] = []

  const newTempFile = async (content: string) => {
    const filePath = path.join(os.tmpdir(), `${uuidv4()}.csv`)
    filePaths.push(filePath)
    await FileUtils.writeFile(filePath, content)
    return filePath
  }

  afterAll(async () => {
    for (const filePath of filePaths) {
      await FileUtils.deleteFileAsync(filePath)
    }
  })

  test('reads only the location of the sampling points with a location', async () => {
    const filePath = await newTempFile(csvContent)
    const { headers, points } = await SamplingPointDataWhispAnalysisJob.readSamplingPoints({
      filePath,
      srsIndex: DEFAULT_SRS_INDEX,
    })
    expect(headers).toEqual(['level_1_code', 'location_x', 'location_y', 'location_srs'])
    expect(points).toEqual({ rowIndexes: [0, 2], coordinates: [10.5, 5.25, -1.5, 7] })

    const features = SamplingPointDataWhispAnalysisJob.buildBatchFeatures({ points, start: 1, end: 2 })
    expect(features).toEqual([
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-1.5, 7] },
        properties: { external_id: '2' },
      },
    ])
  })

  test('combines the sampling point data rows with the Whisp values, by row index', async () => {
    const samplingPointDataFilePath = await newTempFile(csvContent)
    const columnsCollector = new WhispColumnsCollector()
    const lines = SamplingPointDataWhispAnalysisJob.toWhispValuesLines({
      whispFeatures: [
        { properties: { external_id: '2', Country: 'CIV' } },
        { properties: { external_id: 'unknown', Country: 'XXX' } },
        { properties: { external_id: '0', Country: 'GHA', Area: 1.5 } },
      ],
      columnsCollector,
    })
    expect(lines).toEqual([
      [0, { Country: 'GHA', Area: 1.5 }],
      [2, { Country: 'CIV' }],
    ])
    const whispValuesFilePath = await newTempFile(lines.map((line) => `${JSON.stringify(line)}\n`).join(''))
    const whispColumns = columnsCollector.getColumns({ existingColumnNames: [] })

    const rows = await readAll(
      SamplingPointDataWhispAnalysisJob.generateCombinedRows({
        samplingPointDataFilePath,
        whispColumns,
        whispValuesFilePath,
      })
    )
    expect(rows.map((row) => ({ ...row }))).toEqual([
      { level_1_code: 'A', location_x: '10.5', location_y: '5.25', location_srs: '4326', country: 'GHA', area: 1.5 },
      { level_1_code: 'B', location_x: '', location_y: '', location_srs: '' },
      { level_1_code: 'C', location_x: '-1.5', location_y: '7', location_srs: '4326', country: 'CIV', area: '' },
    ])
  })
})
