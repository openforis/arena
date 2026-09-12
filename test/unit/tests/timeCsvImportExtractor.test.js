import { extractTimeValue } from '@server/modules/dataImport/service/DataImportJob/dataImportFlatDataFileReader'

// The file's internal VALUE_PROP_DEFAULT constant is the literal string 'value' —
// this test builds its `value` param the same shape `extractDateOrTime`'s callers use.
describe('CSV import - time value extraction', () => {
  it('accepts HH:mm into a seconds-off attribute, unchanged', () => {
    const nodeDef = { props: {} }
    const result = extractTimeValue({ value: { value: '14:30' }, headers: ['time_col'], nodeDef })
    expect(result.value).toBe('14:30')
  })

  it('truncates HH:mm:ss to HH:mm for a seconds-off attribute', () => {
    const nodeDef = { props: {} }
    const result = extractTimeValue({ value: { value: '14:30:45' }, headers: ['time_col'], nodeDef })
    expect(result.value).toBe('14:30')
  })

  it('keeps seconds for a seconds-on attribute', () => {
    const nodeDef = { props: { includeSeconds: true } }
    const result = extractTimeValue({ value: { value: '14:30:45' }, headers: ['time_col'], nodeDef })
    expect(result.value).toBe('14:30:45')
  })

  it('accepts HH:mm into a seconds-on attribute without forcing :00', () => {
    const nodeDef = { props: { includeSeconds: true } }
    const result = extractTimeValue({ value: { value: '14:30' }, headers: ['time_col'], nodeDef })
    expect(result.value).toBe('14:30')
  })
})
