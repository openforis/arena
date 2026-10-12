import {
  extractWhispColumns,
  findNumericColumns,
  isWhispPropExcluded,
  toCellValue,
  toChunks,
} from '@server/modules/geo/service/whispSamplingPointData/whispResultsUtils'

const features = [
  {
    properties: {
      external_id: 'a',
      plotId: '1',
      Area: 1.5,
      Country: 'GHA',
      GFC_TC_2020: 0.3,
      GFC_loss_year_2021: 0,
      'GLAD-L_year_2022': 0,
      MODIS_fire_2020: 0,
      risk_pcrop: 'low',
      whisp_processing_metadata: { whisp_version: '3.0.0' },
    },
  },
  { properties: { external_id: 'b', Area: null, Country: 'CIV', GFC_TC_2020: 0.1, risk_pcrop: 'high' } },
]

describe('Whisp results utils', () => {
  test('excluded props', () => {
    expect(isWhispPropExcluded('external_id')).toBe(true)
    expect(isWhispPropExcluded('RADD_year_2023')).toBe(true)
    expect(isWhispPropExcluded('ESA_fire_2019')).toBe(true)
    expect(isWhispPropExcluded('GLAD-S2_year_2024')).toBe(true)
    expect(isWhispPropExcluded('GFC_TC_2020')).toBe(false)
  })

  test('columns are lower case, excluded/non-primitive props skipped, conflicts prefixed', () => {
    const columns = extractWhispColumns({ features, existingColumnNames: ['plot_code', 'location', 'area'] })
    expect(columns).toEqual([
      { prop: 'Area', column: 'whisp_area' },
      { prop: 'Country', column: 'country' },
      { prop: 'GFC_TC_2020', column: 'gfc_tc_2020' },
      { prop: 'risk_pcrop', column: 'risk_pcrop' },
    ])
  })

  test('numeric columns', () => {
    const columns = extractWhispColumns({ features, existingColumnNames: [] })
    expect(findNumericColumns({ columns, features })).toEqual(['area', 'gfc_tc_2020'])
  })

  test('cell values', () => {
    expect(toCellValue(null)).toBe('')
    expect(toCellValue(Number.NaN)).toBe('')
    expect(toCellValue(2.5)).toBe(2.5)
    expect(toCellValue(true)).toBe('true')
  })

  test('chunks', () => {
    expect(toChunks([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })
})
