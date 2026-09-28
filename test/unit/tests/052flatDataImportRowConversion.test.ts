import { FlatDataExportModel } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'

import { buildTestSurvey, fileFormats, readRowItems, Rows } from '../../utils/flatDataImportTestUtils'

// the conversion of rows into node values must give the same results for every supported file format
describe.each(fileFormats)('Data import: conversion of %s rows into node values', (fileFormat) => {
  let survey: any

  const uuidOf = (name: string) => Survey.getNodeDefByName(name)(survey).uuid

  const readPlotItems = async (rows: Rows) => readRowItems({ survey, entityName: 'plot', fileFormat, rows })

  beforeAll(async () => {
    survey = await buildTestSurvey({ uuid: 'user-uuid' })
  })

  test('the expected headers are the ancestor keys and the entity attributes', () => {
    const { headers } = new FlatDataExportModel({
      survey,
      cycle: Survey.cycleOneKey,
      nodeDefContext: Survey.getNodeDefByName('plot')(survey),
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
    const items = await readPlotItems([
      ['cluster_id', 'plot_id', 'plot_size', 'plot_accessible', 'plot_visit_date', 'plot_status', 'plot_remarks'],
      [1, 2, 12.5, 'yes', '2024-03-05', 'A', 'some remarks'],
    ])
    expect(items).toHaveLength(1)
    const { valuesByDefUuid, errors } = items[0]
    expect(errors).toEqual([])
    expect(valuesByDefUuid[uuidOf('cluster_id')]).toBe(1)
    expect(valuesByDefUuid[uuidOf('plot_id')]).toBe(2)
    expect(valuesByDefUuid[uuidOf('plot_size')]).toBe(12.5)
    expect(valuesByDefUuid[uuidOf('plot_accessible')]).toBe('true')
    expect(valuesByDefUuid[uuidOf('plot_visit_date')]).toBe('2024-03-05')
    expect(valuesByDefUuid[uuidOf('plot_status')].itemUuid).toBeDefined()
    expect(valuesByDefUuid[uuidOf('plot_remarks')]).toBe('some remarks')
  })

  test('numeric text values are imported as text', async () => {
    const items = await readPlotItems([
      ['cluster_id', 'plot_id', 'plot_remarks'],
      [1, 2, 123],
    ])
    expect(items[0].valuesByDefUuid[uuidOf('plot_remarks')]).toBe('123')
  })

  test('empty cells are skipped', async () => {
    const items = await readPlotItems([
      ['cluster_id', 'plot_id', 'plot_size'],
      [1, 2, null],
    ])
    const { valuesByDefUuid } = items[0]
    expect(valuesByDefUuid[uuidOf('plot_id')]).toBe(2)
    expect(uuidOf('plot_size') in valuesByDefUuid).toBe(false)
  })

  test('invalid values are reported as row errors, without stopping the reader', async () => {
    const items = await readPlotItems([
      ['cluster_id', 'plot_id', 'plot_size', 'plot_status'],
      [1, 2, 'not_a_number', 'A'],
      [1, 3, 5, 'Z'],
      [1, 4, 6, 'B'],
    ])
    expect(items).toHaveLength(3)
    expect(items[0].errors.map((e: any) => e.key)).toEqual(['validationErrors:dataImport.invalidNumber'])
    expect(items[1].errors.map((e: any) => e.key)).toEqual(['validationErrors:dataImport.invalidCode'])
    expect(items[2].errors).toEqual([])
  })

  test('fails when a column header is not valid for the selected entity', async () => {
    await expect(
      readPlotItems([
        ['cluster_id', 'plot_id', 'unknown_column'],
        [1, 2, 3],
      ])
    ).rejects.toMatchObject({
      key: 'validationErrors:dataImport.invalidHeaders',
    })
  })

  test('fails when a key column is missing', async () => {
    await expect(
      readPlotItems([
        ['cluster_id', 'plot_size'],
        [1, 2],
      ])
    ).rejects.toMatchObject({
      key: 'validationErrors:dataImport.missingRequiredHeaders',
    })
  })
})
