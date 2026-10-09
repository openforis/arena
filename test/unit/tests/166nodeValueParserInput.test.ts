import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'
import * as NodeRefData from '@core/record/nodeRefData'

import { isNodeDefValueEditable, parseNodeValueInput } from '@core/record/nodeValueParser'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import * as RecordUtils from '../../utils/recordUtils'
import * as SurveyUtils from '../../utils/surveyUtils'

const user = { uuid: 'user-uuid' }

const buildSurvey = () =>
  SB.survey(
    user,
    SB.entity(
      'cluster',
      SB.attribute('cluster_id', NodeDef.nodeDefType.integer).key(),
      SB.attribute('cluster_size', NodeDef.nodeDefType.decimal),
      SB.attribute('cluster_accessible', NodeDef.nodeDefType.boolean),
      SB.attribute('cluster_date', NodeDef.nodeDefType.date),
      SB.attribute('cluster_time', NodeDef.nodeDefType.time),
      SB.attribute('cluster_location', NodeDef.nodeDefType.coordinate),
      SB.attribute('cluster_species', NodeDef.nodeDefType.taxon).taxonomy('trees'),
      SB.attribute('cluster_remarks', NodeDef.nodeDefType.text),
      SB.attribute('cluster_photo', NodeDef.nodeDefType.file),
      SB.attribute('cluster_total', NodeDef.nodeDefType.decimal).readOnly(),
      SB.attribute('cluster_estimate', NodeDef.nodeDefType.decimal).analysis(),
      SB.attribute('region', NodeDef.nodeDefType.code).category('admin'),
      SB.attribute('district', NodeDef.nodeDefType.code).category('admin').parentCode('region')
    )
  )
    .categories(
      SB.category('admin')
        .levels('region', 'district')
        .items(
          SB.categoryItem('1').items(SB.categoryItem('11'), SB.categoryItem('12')),
          SB.categoryItem('2').items(SB.categoryItem('21'))
        )
    )
    .taxonomies(SB.taxonomy('trees').taxa(SB.taxon('AFZ/QUA', 'Fabaceae', 'Afzelia', 'Afzelia quanzensis')))
    .build()

describe('nodeValueParser: parseNodeValueInput (the assistant layer)', () => {
  let survey: any
  let record: any
  let rootNode: any
  const taxonByScientificName: Record<string, unknown> = {}
  const categoryItemProvider = {
    getItemByCodePaths: jest.fn(async ({ codePaths }: { codePaths: string[] }) =>
      codePaths.join('/') === '1/99' ? { uuid: 'big-item-uuid', props: { code: '99' } } : null
    ),
  }
  const taxonProvider = {
    getTaxonByCode: async () => null,
    findTaxonByScientificName: async ({ scientificName }: { scientificName: string }) =>
      taxonByScientificName[scientificName] ?? null,
  }

  const parse = (name: string, input: unknown) =>
    parseNodeValueInput({
      survey,
      nodeDef: Survey.getNodeDefByName(name)(survey),
      input: input as any,
      record,
      parentNode: rootNode,
      categoryItemProvider,
      taxonProvider,
    })

  beforeAll(async () => {
    survey = await buildSurvey()
    const regionItemUuid = SurveyUtils.getCategoryItemUuid({ survey, categoryName: 'admin', codesPath: ['1'] })
    record = RB.record(
      user,
      survey,
      RB.entity('cluster', RB.attribute('cluster_id', 1), RB.attribute('region', { itemUuid: regionItemUuid }))
    ).build()
    rootNode = Record.getRootNode(record)
    const taxon = Survey.getTaxonByCode({
      taxonomyUuid: NodeDef.getTaxonomyUuid(Survey.getNodeDefByName('cluster_species')(survey)),
      taxonCode: 'AFZ/QUA',
    })(survey)
    taxonByScientificName['Afzelia quanzensis'] = taxon
  })

  test('only plain attributes are editable', async () => {
    expect(isNodeDefValueEditable(Survey.getNodeDefByName('cluster_size')(survey))).toBe(true)
    expect(isNodeDefValueEditable(Survey.getNodeDefByName('cluster')(survey))).toBe(false)
    await expect(parse('cluster_total', '1')).rejects.toMatchObject({
      key: 'validationErrors:nodeValueParser.attributeNotEditable',
      params: { attributeName: 'cluster_total' },
    })
    await expect(parse('cluster_estimate', '1')).rejects.toMatchObject({
      key: 'validationErrors:nodeValueParser.attributeNotEditable',
    })
  })

  test('null and empty strings clear the value', async () => {
    expect(await parse('cluster_size', null)).toEqual({ value: null, refData: null })
    expect(await parse('cluster_remarks', '  ')).toEqual({ value: null, refData: null })
  })

  test('text is kept as is', async () => {
    expect((await parse('cluster_remarks', ' some text ')).value).toBe(' some text ')
  })

  test('integers must be whole numbers; decimals accept fractions', async () => {
    expect((await parse('cluster_id', '12')).value).toBe(12)
    await expect(parse('cluster_id', '1.5')).rejects.toMatchObject({ key: 'validationErrors:dataImport.invalidNumber' })
    expect((await parse('cluster_size', '1.5')).value).toBe(1.5)
    await expect(parse('cluster_size', 'abc')).rejects.toMatchObject({
      key: 'validationErrors:dataImport.invalidNumber',
      params: { headers: ['cluster_size'] },
    })
  })

  test('booleans, dates and times reuse the import formats', async () => {
    expect((await parse('cluster_accessible', 'no')).value).toBe('false')
    expect((await parse('cluster_accessible', true)).value).toBe('true')
    expect((await parse('cluster_date', '05/03/2024')).value).toBe('2024-03-05')
    expect((await parse('cluster_time', '14:30')).value).toBe('14:30')
    await expect(parse('cluster_date', 'yesterday')).rejects.toMatchObject({
      key: 'validationErrors:dataImport.invalidDate',
    })
  })

  test('coordinates as "x y srs", "x,y", or an object; the srs must be one of the survey', async () => {
    expect((await parse('cluster_location', '12.5 41.9 EPSG:4326')).value).toEqual({ x: 12.5, y: 41.9, srs: '4326' })
    // a survey with a single SRS: the srs can be omitted
    expect((await parse('cluster_location', '12.5,41.9')).value).toEqual({ x: 12.5, y: 41.9, srs: '4326' })
    expect((await parse('cluster_location', { x: 1, y: 2, srs: '4326' })).value).toEqual({ x: 1, y: 2, srs: '4326' })
    await expect(parse('cluster_location', '12.5 41.9 3857')).rejects.toMatchObject({
      key: 'validationErrors:dataImport.invalidCoordinate',
    })
    await expect(parse('cluster_location', 'north')).rejects.toMatchObject({
      key: 'validationErrors:dataImport.invalidCoordinate',
    })
  })

  test('first-level codes are found in the survey index', async () => {
    const { value, refData } = await parse('region', '2')
    expect(value[Node.valuePropsCode.itemUuid]).toBe(
      SurveyUtils.getCategoryItemUuid({ survey, categoryName: 'admin', codesPath: ['2'] })
    )
    expect(refData[NodeRefData.keys.categoryItem]).toBeDefined()
  })

  test('hierarchical codes are found under the parent code attribute item', async () => {
    const { value } = await parse('district', '12')
    expect(value[Node.valuePropsCode.itemUuid]).toBe(
      SurveyUtils.getCategoryItemUuid({ survey, categoryName: 'admin', codesPath: ['1', '12'] })
    )
    // '21' exists, but under region 2
    await expect(parse('district', '21')).rejects.toMatchObject({ key: 'validationErrors:dataImport.invalidCode' })
  })

  test('codes not in the index are looked up by code path through the provider (big categories)', async () => {
    const { value } = await parse('district', '99')
    expect(value[Node.valuePropsCode.itemUuid]).toBe('big-item-uuid')
    expect(categoryItemProvider.getItemByCodePaths).toHaveBeenCalledWith(
      expect.objectContaining({ codePaths: ['1', '99'] })
    )
  })

  test('a hierarchical code without a parent value is refused', async () => {
    const recordNoRegion = RB.record(user, survey, RB.entity('cluster', RB.attribute('cluster_id', 2))).build()
    await expect(
      parseNodeValueInput({
        survey,
        nodeDef: Survey.getNodeDefByName('district')(survey),
        input: '11',
        record: recordNoRegion,
        parentNode: Record.getRootNode(recordNoRegion),
        categoryItemProvider,
        taxonProvider,
      })
    ).rejects.toMatchObject({ key: 'validationErrors:dataImport.invalidCode' })
  })

  test('taxa by code, then by scientific name through the provider', async () => {
    const byCode = await parse('cluster_species', 'AFZ/QUA')
    const byName = await parse('cluster_species', 'Afzelia quanzensis')
    expect(byCode.value[Node.valuePropsTaxon.taxonUuid]).toBeDefined()
    expect(byName.value[Node.valuePropsTaxon.taxonUuid]).toBe(byCode.value[Node.valuePropsTaxon.taxonUuid])
    await expect(parse('cluster_species', 'Quercus robur')).rejects.toMatchObject({
      key: 'validationErrors:dataImport.invalidTaxonCode',
    })
  })

  test('unlisted taxa are refused, whatever the way they are found (UNL, UNK, provider)', async () => {
    await expect(parse('cluster_species', 'UNL')).rejects.toMatchObject({
      key: 'validationErrors:dataImport.invalidTaxonCode',
    })
    await expect(parse('cluster_species', 'UNK')).rejects.toMatchObject({
      key: 'validationErrors:dataImport.invalidTaxonCode',
    })
    const unlistedProvider = {
      getTaxonByCode: async () => null,
      findTaxonByScientificName: async () => ({ uuid: 'unl-uuid', props: { code: 'UNL' } }),
    }
    await expect(
      parseNodeValueInput({
        survey,
        nodeDef: Survey.getNodeDefByName('cluster_species')(survey),
        input: 'Some unlisted name',
        record,
        parentNode: rootNode,
        categoryItemProvider,
        taxonProvider: unlistedProvider,
      })
    ).rejects.toMatchObject({ key: 'validationErrors:dataImport.invalidTaxonCode' })
  })

  test('scientific names are looked up through the provider only, never the survey index', async () => {
    const emptyProvider = { getTaxonByCode: async () => null, findTaxonByScientificName: async () => null }
    await expect(
      parseNodeValueInput({
        survey,
        nodeDef: Survey.getNodeDefByName('cluster_species')(survey),
        input: 'Afzelia quanzensis',
        record,
        parentNode: rootNode,
        categoryItemProvider,
        taxonProvider: emptyProvider,
      })
    ).rejects.toMatchObject({ key: 'validationErrors:dataImport.invalidTaxonCode' })
  })

  test('non-finite and non-decimal numbers are refused', async () => {
    for (const bad of ['Infinity', '-Infinity', 'NaN', '0x10', '1e999', '1,5', Infinity, NaN]) {
      await expect(parse('cluster_size', bad)).rejects.toMatchObject({
        key: 'validationErrors:dataImport.invalidNumber',
      })
      await expect(parse('cluster_id', bad)).rejects.toMatchObject({ key: 'validationErrors:dataImport.invalidNumber' })
    }
    expect((await parse('cluster_size', '-1.5e2')).value).toBe(-150)
    expect((await parse('cluster_id', 7)).value).toBe(7)
  })

  test('objects are refused for text attributes', async () => {
    await expect(parse('cluster_remarks', { a: 1 })).rejects.toMatchObject({
      key: 'validationErrors:nodeValueParser.unsupportedType',
    })
  })

  test('file attributes are refused', async () => {
    await expect(parse('cluster_photo', 'photo.jpg')).rejects.toMatchObject({
      key: 'validationErrors:nodeValueParser.unsupportedType',
    })
  })

  test('the record helper finds the node used in the tests', () => {
    expect(RecordUtils.findNodeByPath('cluster/region')(survey, record)).toBeDefined()
  })
})
