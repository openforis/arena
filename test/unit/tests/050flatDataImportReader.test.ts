import { Readable } from 'stream'

import { FlatDataExportModel } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { FileFormats } from '@core/fileFormats'

import * as FlatDataReader from '@server/utils/file/flatDataReader'
import { DataImportFlatDataFileReader } from '@server/modules/dataImport/service/DataImportJob/dataImportFlatDataFileReader'
import { TaxonProviderDefault } from '@server/modules/taxonomy/manager/taxonProviderDefault'

import * as SB from '../../utils/surveyBuilder'

const csvStream = (content: string) => Readable.from([content])

const readCsvRows = async (content: string) => {
  const headersRead: string[][] = []
  const rows: any[] = []
  const reader = FlatDataReader.createReaderFromStream({
    stream: csvStream(content),
    fileFormat: FileFormats.csv,
    onHeaders: async (headers: string[]) => {
      headersRead.push(headers)
    },
    onRow: async (row: any) => {
      rows.push({ ...row })
    },
  })
  await reader.start()
  return { headers: headersRead[0], rows }
}

describe('FlatDataReader (csv)', () => {
  test('reads headers and rows as objects', async () => {
    const { headers, rows } = await readCsvRows('a,b,c\n1,2,3\n4,5,6\n')
    expect(headers).toEqual(['a', 'b', 'c'])
    expect(rows).toEqual([
      { a: '1', b: '2', c: '3' },
      { a: '4', b: '5', c: '6' },
    ])
  })

  test('trims headers and cell values', async () => {
    const { headers, rows } = await readCsvRows(' a , b \n  x  , y \n')
    expect(headers).toEqual(['a', 'b'])
    expect(rows).toEqual([{ a: 'x', b: 'y' }])
  })

  test('ignores empty lines and trailing empty header columns', async () => {
    const { headers, rows } = await readCsvRows('a,b,,\n1,2,,\n\n3,4,,\n')
    expect(headers).toEqual(['a', 'b'])
    expect(rows).toHaveLength(2)
    expect(rows[1]).toEqual({ a: '3', b: '4' })
  })

  test('supports quoted values containing separators and new lines', async () => {
    const { rows } = await readCsvRows('a,b\n"x, y","line1\nline2"\n')
    expect(rows).toEqual([{ a: 'x, y', b: 'line1\nline2' }])
  })

  test('fails when an empty header is found between non-empty headers', async () => {
    await expect(readCsvRows('a,,c\n1,2,3\n')).rejects.toMatchObject({ key: 'appErrors:csv.emptyHeaderFound' })
  })

  test('stops reading when canceled', async () => {
    const rows: any[] = []
    const reader = FlatDataReader.createReaderFromStream({
      stream: csvStream('a\n1\n2\n3\n'),
      fileFormat: FileFormats.csv,
      onRow: async (row: any) => {
        rows.push({ ...row })
        reader.cancel()
      },
    })
    await reader.start().catch(() => {})
    expect(rows).toHaveLength(1)
  })
})

describe('DataImportFlatDataFileReader (csv rows to node values)', () => {
  let survey: any
  let plotDef: any
  let clusterIdDef: any
  let plotIdDef: any
  let plotSizeDef: any
  let plotStatusDef: any
  let plotVisitDef: any

  beforeAll(async () => {
    const user = { uuid: 'user-uuid' }
    survey = await SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_id', NodeDef.nodeDefType.integer).key(),
        SB.entity(
          'plot',
          SB.attribute('plot_id', NodeDef.nodeDefType.integer).key(),
          SB.attribute('plot_size', NodeDef.nodeDefType.decimal),
          SB.attribute('plot_accessible', NodeDef.nodeDefType.boolean),
          SB.attribute('plot_visit_date', NodeDef.nodeDefType.date),
          SB.attribute('plot_status', NodeDef.nodeDefType.code).category('plot_status'),
          SB.attribute('plot_remarks', NodeDef.nodeDefType.text)
        ).multiple()
      )
    )
      .categories(SB.category('plot_status').items(SB.categoryItem('A'), SB.categoryItem('B')))
      .build()
    plotDef = Survey.getNodeDefByName('plot')(survey)
    clusterIdDef = Survey.getNodeDefByName('cluster_id')(survey)
    plotIdDef = Survey.getNodeDefByName('plot_id')(survey)
    plotSizeDef = Survey.getNodeDefByName('plot_size')(survey)
    plotStatusDef = Survey.getNodeDefByName('plot_status')(survey)
    plotVisitDef = Survey.getNodeDefByName('plot_visit_date')(survey)
  })

  const readItems = async (content: string) => {
    const items: any[] = []
    const reader = DataImportFlatDataFileReader.createReaderFromStream({
      stream: csvStream(content),
      fileFormat: FileFormats.csv,
      survey,
      // items not found in the survey index are looked up in the DB by the default provider: stub it
      categoryItemProvider: { getItemByCodePaths: async () => null },
      taxonProvider: TaxonProviderDefault,
      cycle: Survey.cycleOneKey,
      nodeDefUuid: plotDef.uuid,
      onRowItem: async (item: any) => {
        items.push(item)
      },
    })
    await reader.start()
    return items
  }

  test('the expected headers are the ancestor keys and the entity attributes', () => {
    const { headers } = new FlatDataExportModel({
      survey,
      cycle: Survey.cycleOneKey,
      nodeDefContext: plotDef,
      options: { includeCategoryItemsLabels: false, includeFiles: false, includeAnalysis: false },
    })
    expect(headers).toEqual(
      expect.arrayContaining([
        'cluster_id',
        'plot_id',
        'plot_size',
        'plot_accessible',
        'plot_visit_date',
        'plot_status',
      ])
    )
  })

  test('converts cell values into typed node values', async () => {
    const items = await readItems(
      'cluster_id,plot_id,plot_size,plot_accessible,plot_visit_date,plot_status,plot_remarks\n' +
        '1,2,12.5,yes,2024-03-05,A,some remarks\n'
    )
    expect(items).toHaveLength(1)
    const { valuesByDefUuid, errors } = items[0]
    expect(errors).toEqual([])
    expect(valuesByDefUuid[clusterIdDef.uuid]).toBe(1)
    expect(valuesByDefUuid[plotIdDef.uuid]).toBe(2)
    expect(valuesByDefUuid[plotSizeDef.uuid]).toBe(12.5)
    expect(valuesByDefUuid[plotVisitDef.uuid]).toBe('2024-03-05')
    expect(valuesByDefUuid[plotStatusDef.uuid].itemUuid).toBeDefined()
  })

  test('empty cells are skipped', async () => {
    const items = await readItems('cluster_id,plot_id,plot_size\n1,2,\n')
    const { valuesByDefUuid } = items[0]
    expect(valuesByDefUuid[plotIdDef.uuid]).toBe(2)
    expect(plotSizeDef.uuid in valuesByDefUuid).toBe(false)
  })

  test('invalid values are reported as row errors, without stopping the reader', async () => {
    const items = await readItems(
      'cluster_id,plot_id,plot_size,plot_status\n' + '1,2,not_a_number,A\n' + '1,3,5,Z\n' + '1,4,6,B\n'
    )
    expect(items).toHaveLength(3)
    expect(items[0].errors.map((e: any) => e.key)).toEqual(['validationErrors:dataImport.invalidNumber'])
    expect(items[1].errors.map((e: any) => e.key)).toEqual(['validationErrors:dataImport.invalidCode'])
    expect(items[2].errors).toEqual([])
  })

  test('fails when a column header is not valid for the selected entity', async () => {
    await expect(readItems('cluster_id,plot_id,unknown_column\n1,2,3\n')).rejects.toMatchObject({
      key: 'validationErrors:dataImport.invalidHeaders',
    })
  })

  test('fails when a key column is missing', async () => {
    await expect(readItems('cluster_id,plot_size\n1,2\n')).rejects.toMatchObject({
      key: 'validationErrors:dataImport.missingRequiredHeaders',
    })
  })
})
