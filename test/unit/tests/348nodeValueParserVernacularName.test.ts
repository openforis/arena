import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'

import { parseNodeValueProps } from '@core/record/nodeValueParser'

import * as SB from '../../utils/surveyBuilder'

const { vernacularNameUuid } = Node.valuePropsTaxon

describe('nodeValueParser: the vernacular name of a taxon (348)', () => {
  let survey: any

  // a taxon of a big taxonomy, given by the provider: the test builder does not keep several vernacular names
  const taxon = Taxon.newTaxon({
    taxonomyUuid: 'taxonomy-uuid',
    code: 'AFZ/QUA',
    family: 'Fabaceae',
    genus: 'Afzelia',
    scientificName: 'Afzelia quanzensis',
    vernacularNames: {
      eng: [TaxonVernacularName.newTaxonVernacularName('eng', 'Mahogany')],
      fra: [TaxonVernacularName.newTaxonVernacularName('fra', 'Doussie')],
    },
  })

  const parse = async (vernacularName: string | null) => {
    const { value } = await parseNodeValueProps({
      survey,
      nodeDef: Survey.getNodeDefByName('species')(survey),
      valueProps: { code: 'AFZ/QUA', vernacularName },
      headers: ['species'],
      categoryItemProvider: { getItemByCodePaths: async () => null },
      taxonProvider: { getTaxonByCode: async () => taxon },
    })
    return value
  }

  beforeAll(async () => {
    survey = await SB.survey(
      { uuid: 'user-uuid' },
      SB.entity(
        'cluster',
        SB.attribute('cluster_id', NodeDef.nodeDefType.integer).key(),
        SB.attribute('species', NodeDef.nodeDefType.taxon).taxonomy('trees')
      )
    )
      .taxonomies(SB.taxonomy('trees').taxa(SB.taxon('OTHER', 'Fabaceae', 'Other', 'Other species')))
      .build()
  })

  test.each(['Mahogany', 'Mahogany (eng)', 'Doussie (fra)'])('"%s" finds the vernacular name', async (name) => {
    expect((await parse(name))[vernacularNameUuid]).toBeTruthy()
  })

  test.each([
    ['a name of another language', 'Mahogany (fra)'],
    ['an unknown name', 'Teak'],
    ['an empty value', ''],
    ['no value', null],
  ])('%s sets no vernacular name', async (_description, name) => {
    expect((await parse(name))[vernacularNameUuid]).toBeUndefined()
  })

  test.each(['(eng)', 'Mahogany (', 'Mahogany (eng', '(', 'Mahogany (eng) (fra)'])(
    'a text that is not "Name" or "Name (lang)" ("%s") sets no vernacular name and does not crash',
    async (name) => {
      expect((await parse(name))[vernacularNameUuid]).toBeUndefined()
    }
  )
})
