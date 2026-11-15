import * as Survey from '@core/survey/survey'
import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'

const taxonomyUuid = 'taxonomy-1'
const vernacularNameEn = TaxonVernacularName.newTaxonVernacularName('en', 'Oak')
const vernacularNameEs = TaxonVernacularName.newTaxonVernacularName('es', 'Roble')
const taxon = Taxon.newTaxon({
  taxonomyUuid,
  code: 'QUE',
  scientificName: 'Quercus',
  vernacularNames: { en: [vernacularNameEn], es: [vernacularNameEs] },
})

describe('Taxon.getVernacularNameUuidByName', () => {
  it('finds the vernacular name in any language', () => {
    expect(Taxon.getVernacularNameUuidByName('Oak')(taxon)).toBe(TaxonVernacularName.getUuid(vernacularNameEn))
    expect(Taxon.getVernacularNameUuidByName('Roble')(taxon)).toBe(TaxonVernacularName.getUuid(vernacularNameEs))
  })

  it('returns undefined for an unknown name or a language code', () => {
    expect(Taxon.getVernacularNameUuidByName('Pine')(taxon)).toBeUndefined()
    expect(Taxon.getVernacularNameUuidByName('en')(taxon)).toBeUndefined()
  })
})

describe('Survey.getTaxonVernacularNameUuid', () => {
  const survey = Survey.assocRefData({ taxaIndexRefData: [taxon] })({} as any)
  const nodeDef = { uuid: 'node-def-1', type: 'taxon', props: { taxonomyUuid } } as any

  it('returns the uuid of the vernacular name with the specified name', () => {
    expect(Survey.getTaxonVernacularNameUuid({ nodeDef, taxonCode: 'QUE', vernacularName: 'Roble' })(survey)).toBe(
      TaxonVernacularName.getUuid(vernacularNameEs)
    )
  })

  it('returns undefined when the taxon is not in the ref data', () => {
    expect(
      Survey.getTaxonVernacularNameUuid({ nodeDef, taxonCode: 'UNKNOWN', vernacularName: 'Roble' })(survey)
    ).toBeUndefined()
  })
})
