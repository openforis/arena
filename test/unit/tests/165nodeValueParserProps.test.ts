import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'

import { VALUE_PROP_DEFAULT, parseNodeValueProps } from '@core/record/nodeValueParser'

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

  // booleans accept the import synonyms, dates and times use the import formats
  test.each([
    ['cluster_id', '12', 12],
    ['cluster_size', '12.5', 12.5],
    ['cluster_accessible', 'yes', 'true'],
    ['cluster_accessible', '0', 'false'],
    ['cluster_date', '05/03/2024', '2024-03-05'],
    ['cluster_date', '2024-03-05', '2024-03-05'],
    ['cluster_time', '9:05', '09:05'],
  ])('%s: "%s" is parsed as %p', async (name, value, expected) => {
    expect((await parse(name, { value })).value).toBe(expected)
  })

  test.each([
    ['cluster_size', 'abc', 'invalidNumber'],
    ['cluster_accessible', 'maybe', 'invalidBoolean'],
    ['cluster_date', '2024-13-45', 'invalidDate'],
    ['cluster_time', '25:99', 'invalidTime'],
  ])('%s: "%s" is refused with %s', async (name, value, errorKey) => {
    await expect(parse(name, { value })).rejects.toMatchObject({ key: `validationErrors:dataImport.${errorKey}` })
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
