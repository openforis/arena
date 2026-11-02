import { buildDataMatrix } from '@server/modules/surveyRdb/manager/surveyRdbDataMatrix'

const fieldNames = {
  recordUuidField: 'record_uuid',
  recordKeyFields: ['relevee_id'],
  rowFields: ['species', 'layer'],
  valueField: 'cover',
}

const row = (recordUuid: string, releveeId: string | null, species: string | null, layer: string, cover: string) => ({
  record_uuid: recordUuid,
  relevee_id: releveeId,
  species,
  layer,
  cover,
})

describe('buildDataMatrix', () => {
  test('species are merged into one row, with one column per record', () => {
    const { fields, items } = buildDataMatrix({
      ...fieldNames,
      rows: [
        row('r1', 'Strooberg 1', 'Rumex acetosella', '6', '5'),
        row('r2', 'kelmonderbos 4', 'Rumex acetosella', '6', '2'),
        row('r2', 'kelmonderbos 4', 'Aegopodium podagraria', '6', '6'),
      ],
    })
    expect(fields).toEqual(['species', 'layer', 'kelmonderbos 4', 'Strooberg 1'])
    expect(items).toEqual([
      { species: 'Aegopodium podagraria', layer: '6', 'kelmonderbos 4': '6' },
      { species: 'Rumex acetosella', layer: '6', 'kelmonderbos 4': '2', 'Strooberg 1': '5' },
    ])
  })

  test('the same species in different layers stays in separate rows', () => {
    const { items } = buildDataMatrix({
      ...fieldNames,
      rows: [row('r1', '1', 'Alnus glutinosa', '6', '1'), row('r1', '1', 'Alnus glutinosa', '1', '5')],
    })
    expect(items).toEqual([
      { species: 'Alnus glutinosa', layer: '1', '1': '5' },
      { species: 'Alnus glutinosa', layer: '6', '1': '1' },
    ])
  })

  test('conflicting values of a repeated row are all kept', () => {
    const { items } = buildDataMatrix({
      ...fieldNames,
      rows: [
        row('r1', '1', 'Draba verna', '6', '3'),
        row('r1', '1', 'Draba verna', '6', '2'),
        row('r1', '1', 'Draba verna', '6', '3'),
      ],
    })
    expect(items).toEqual([{ species: 'Draba verna', layer: '6', '1': '2; 3' }])
  })

  test('records with the same keys are not merged', () => {
    const { fields, items } = buildDataMatrix({
      ...fieldNames,
      rows: [row('r1', 'A', 'Draba verna', '6', '1'), row('r2', 'A', 'Draba verna', '6', '2')],
    })
    expect(fields).toEqual(['species', 'layer', 'A', 'A (2)'])
    expect(items).toEqual([{ species: 'Draba verna', layer: '6', A: '1', 'A (2)': '2' }])
  })

  test('record columns cannot overwrite the row fields', () => {
    const { fields } = buildDataMatrix({ ...fieldNames, rows: [row('r1', 'layer', 'Draba verna', '6', '1')] })
    expect(fields).toEqual(['species', 'layer', 'layer (2)'])
  })

  test('records without keys are identified by their uuid', () => {
    const { fields } = buildDataMatrix({ ...fieldNames, rows: [row('r1', null, 'Draba verna', '6', '1')] })
    expect(fields).toEqual(['species', 'layer', 'r1'])
  })

  test('rows without the main row value are ignored, while species without values are kept', () => {
    const { fields, items } = buildDataMatrix({
      ...fieldNames,
      rows: [row('r1', '1', null, '6', '1'), row('r2', '2', 'Draba verna', '6', '')],
    })
    expect(fields).toEqual(['species', 'layer', '2'])
    expect(items).toEqual([{ species: 'Draba verna', layer: '6' }])
  })

  test('record columns are sorted in natural order', () => {
    const { fields } = buildDataMatrix({
      ...fieldNames,
      rows: [row('r1', '10', 'Draba verna', '6', '1'), row('r2', '9', 'Draba verna', '6', '1')],
    })
    expect(fields).toEqual(['species', 'layer', '9', '10'])
  })
})
