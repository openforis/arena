import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'

import { VALUE_PROP_DEFAULT, extractTimeValue, parseNodeValueProps } from '@core/record/nodeValueParser'

import * as SB from '../../utils/surveyBuilder'

const stubCategoryItemProvider = { getItemByCodePaths: async () => null }
const stubTaxonProvider = { getTaxonByCode: async () => null }

const buildSurvey = () =>
  SB.survey(
    { uuid: 'user-uuid' },
    SB.entity(
      'cluster',
      SB.attribute('cluster_id', NodeDef.nodeDefType.integer).key(),
      SB.attribute('cluster_size', NodeDef.nodeDefType.decimal),
      SB.attribute('cluster_accessible', NodeDef.nodeDefType.boolean),
      SB.attribute('cluster_date', NodeDef.nodeDefType.date),
      SB.attribute('cluster_time', NodeDef.nodeDefType.time),
      SB.attribute('cluster_status', NodeDef.nodeDefType.code).category('status'),
      SB.attribute('cluster_location', NodeDef.nodeDefType.coordinate),
      SB.attribute('cluster_species', NodeDef.nodeDefType.taxon).taxonomy('trees'),
      SB.attribute('cluster_remarks', NodeDef.nodeDefType.text),
      SB.attribute('cluster_photo', NodeDef.nodeDefType.file)
    )
  )
    .categories(SB.category('status').items(SB.categoryItem('A'), SB.categoryItem('B')))
    .taxonomies(SB.taxonomy('trees').taxa(SB.taxon('AFZ/QUA', 'Fabaceae', 'Afzelia', 'Afzelia quanzensis')))
    .build()

describe('nodeValueParser: parseNodeValueProps (the import layer)', () => {
  let survey: any

  const parse = (name: string, valueProps: Record<string, unknown>) =>
    parseNodeValueProps({
      survey,
      nodeDef: Survey.getNodeDefByName(name)(survey),
      valueProps,
      headers: [name],
      categoryItemProvider: stubCategoryItemProvider,
      taxonProvider: stubTaxonProvider,
    })

  beforeAll(async () => {
    survey = await buildSurvey()
  })

  test('the default value prop is "value"', () => {
    expect(VALUE_PROP_DEFAULT).toBe('value')
  })

  test('numbers', async () => {
    expect((await parse('cluster_id', { value: '12' })).value).toBe(12)
    expect((await parse('cluster_size', { value: '12.5' })).value).toBe(12.5)
    await expect(parse('cluster_size', { value: 'abc' })).rejects.toMatchObject({
      key: 'validationErrors:dataImport.invalidNumber',
    })
  })

  test('booleans accept the import synonyms', async () => {
    expect((await parse('cluster_accessible', { value: 'yes' })).value).toBe('true')
    expect((await parse('cluster_accessible', { value: '0' })).value).toBe('false')
    await expect(parse('cluster_accessible', { value: 'maybe' })).rejects.toMatchObject({
      key: 'validationErrors:dataImport.invalidBoolean',
    })
  })

  test('dates and times use the import formats', async () => {
    expect((await parse('cluster_date', { value: '05/03/2024' })).value).toBe('2024-03-05')
    expect((await parse('cluster_date', { value: '2024-03-05' })).value).toBe('2024-03-05')
    await expect(parse('cluster_date', { value: '2024-13-45' })).rejects.toMatchObject({
      key: 'validationErrors:dataImport.invalidDate',
    })
    expect((await parse('cluster_time', { value: '9:05' })).value).toBe('09:05')
    await expect(parse('cluster_time', { value: '25:99' })).rejects.toMatchObject({
      key: 'validationErrors:dataImport.invalidTime',
    })
  })

  test('extractTimeValue is exported for the import tests', () => {
    const nodeDef = Survey.getNodeDefByName('cluster_time')(survey)
    expect(extractTimeValue({ value: { value: '10:30' }, headers: ['t'], nodeDef }).value).toBe('10:30')
  })

  test('codes of a flat category are found in the survey index, with the item as ref data', async () => {
    const { value, refData } = await parse('cluster_status', { code: 'B' })
    const nodeDef = Survey.getNodeDefByName('cluster_status')(survey)
    const expectedItemUuid = Survey.getCategoryItemUuidAndCodeHierarchy({ nodeDef, code: 'B' })(survey).itemUuid
    expect(expectedItemUuid).toBeTruthy()
    expect(Node.getCategoryItemUuid({ value } as any)).toBe(expectedItemUuid)
    expect(Node.getCategoryItemUuid({ value } as any)).not.toBe(
      Survey.getCategoryItemUuidAndCodeHierarchy({ nodeDef, code: 'A' })(survey).itemUuid
    )
    expect((refData[NodeRefData.keys.categoryItem] as any).uuid).toBe(expectedItemUuid)
    await expect(parse('cluster_status', { code: 'Z' })).rejects.toMatchObject({
      key: 'validationErrors:dataImport.invalidCode',
    })
  })

  test('coordinates strip the EPSG prefix', async () => {
    const { value } = await parse('cluster_location', { x: '12.5', y: '41.9', srs: 'EPSG:4326' })
    expect(value).toMatchObject({ x: '12.5', y: '41.9', srs: '4326' })
  })

  test('taxa are found by code', async () => {
    const { value, refData } = await parse('cluster_species', { code: 'AFZ/QUA' })
    const nodeDef = Survey.getNodeDefByName('cluster_species')(survey)
    const expectedTaxon = Survey.getTaxonByCode({
      taxonomyUuid: NodeDef.getTaxonomyUuid(nodeDef),
      taxonCode: 'AFZ/QUA',
    })(survey)
    expect(expectedTaxon.uuid).toBeTruthy()
    expect(value[Node.valuePropsTaxon.taxonUuid]).toBe(expectedTaxon.uuid)
    expect((refData[NodeRefData.keys.taxon] as any).uuid).toBe(expectedTaxon.uuid)
    await expect(parse('cluster_species', { code: 'NOPE' })).rejects.toMatchObject({
      key: 'validationErrors:dataImport.invalidTaxonCode',
    })
  })

  test('text is converted to a string', async () => {
    expect((await parse('cluster_remarks', { value: 123 })).value).toBe('123')
  })

  test('an attribute type without an extractor is refused', async () => {
    const nodeDef: any = { ...Survey.getNodeDefByName('cluster_remarks')(survey) }
    nodeDef.type = 'unknownType'
    await expect(
      parseNodeValueProps({
        survey,
        nodeDef,
        valueProps: { value: 'x' },
        categoryItemProvider: stubCategoryItemProvider,
        taxonProvider: stubTaxonProvider,
      })
    ).rejects.toMatchObject({ key: 'validationErrors:nodeValueParser.unsupportedType' })
  })
})
