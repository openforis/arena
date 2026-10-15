import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'

import { parseNodeValueInput } from '@core/record/nodeValueParser'
import { isNodeValueShapeValid } from '@core/record/nodeValueShape'
import { uuidv4 } from '@core/uuid'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
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
      SB.attribute('region', NodeDef.nodeDefType.code).category('admin'),
      SB.attribute('district', NodeDef.nodeDefType.code).category('admin').parentCode('region')
    )
  )
    .categories(
      SB.category('admin')
        .levels('region', 'district')
        .items(SB.categoryItem('1').items(SB.categoryItem('11')), SB.categoryItem('2'))
    )
    .taxonomies(SB.taxonomy('trees').taxa(SB.taxon('AFZ/QUA', 'Fabaceae', 'Afzelia', 'Afzelia quanzensis')))
    .build()

// what the assistant may write, per attribute: every one must give a value the batch edit then accepts
const inputsByAttribute: Record<string, unknown[]> = {
  cluster_id: [12, '12', '-3', ' 7 '],
  cluster_size: [1.5, '1.5', '-1.5e2', '3'],
  cluster_accessible: [true, false, 'yes', 'no', 'true', '0', '1'],
  cluster_date: ['2024-03-05', '05/03/2024'],
  cluster_time: ['14:30', '9:05', '14:30:15'],
  cluster_location: [
    '12.5 41.9 EPSG:4326',
    '12.5,41.9',
    { x: 1, y: 2, srs: '4326' },
    { x: '1', y: '2', srs: 'EPSG:4326' },
  ],
  cluster_species: ['AFZ/QUA', 'Afzelia quanzensis'],
  cluster_remarks: ['some text', ' padded ', 'a'.repeat(500)],
  region: ['1', '2'],
  district: ['11'],
}

describe('nodeValueParser: the values it produces pass the shape of a batch edit (352)', () => {
  let survey: any
  let record: any
  let rootNode: any
  const taxonProvider = {
    getTaxonByCode: async () => null,
    findTaxonByScientificName: async () => null,
  }
  const categoryItemProvider = { getItemByCodePaths: async () => ({ uuid: uuidv4(), props: { code: '99' } }) }

  const parse = (nodeDef: any, input: unknown, currentValue: unknown = null) =>
    parseNodeValueInput({
      survey,
      nodeDef,
      input: input as any,
      record,
      parentNode: rootNode,
      currentValue: currentValue as any,
      categoryItemProvider,
      taxonProvider: {
        ...taxonProvider,
        findTaxonByScientificName: async () =>
          Survey.getTaxonByCode({
            taxonomyUuid: NodeDef.getTaxonomyUuid(Survey.getNodeDefByName('cluster_species')(survey)),
            taxonCode: 'AFZ/QUA',
          })(survey),
      },
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
  })

  test('every parsed value of every attribute type is accepted by isNodeValueShapeValid', async () => {
    const parsedCount = { total: 0 }
    for (const [name, inputs] of Object.entries(inputsByAttribute)) {
      const nodeDef = Survey.getNodeDefByName(name)(survey)
      for (const input of inputs) {
        const { value } = await parse(nodeDef, input)
        expect({ name, input, accepted: isNodeValueShapeValid({ nodeDef, value }) }).toEqual({
          name,
          input,
          accepted: true,
        })
        parsedCount.total += 1
      }
    }
    expect(parsedCount.total).toBeGreaterThan(25)
  })

  test('a cleared value (null) is accepted for every attribute type', async () => {
    for (const name of Object.keys(inputsByAttribute)) {
      const nodeDef = Survey.getNodeDefByName(name)(survey)
      const { value } = await parse(nodeDef, null)
      expect(isNodeValueShapeValid({ nodeDef, value })).toBe(true)
    }
  })

  test('a coordinate keeps only the additional fields the attribute collects', async () => {
    const nodeDef = Survey.getNodeDefByName('cluster_location')(survey)
    const currentValue = { x: 1, y: 2, srs: '4326', accuracy: 3, altitude: 120, altitudeAccuracy: 5, evil: 'x' }

    // none collected: the fields of the current value are dropped
    const { value: plain } = await parse(nodeDef, '12.5 41.9 4326', currentValue)
    expect(plain).toEqual({ x: 12.5, y: 41.9, srs: '4326' })

    // accuracy and altitude collected: those are kept, the others are not
    const collecting = { ...nodeDef, props: { ...nodeDef.props, includeAccuracy: true, includeAltitude: true } }
    const { value } = await parse(collecting, '12.5 41.9 4326', currentValue)
    expect(value).toEqual({ x: 12.5, y: 41.9, srs: '4326', accuracy: 3, altitude: 120 })
    expect(isNodeValueShapeValid({ nodeDef: collecting, value })).toBe(true)
  })
})
