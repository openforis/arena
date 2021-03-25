import * as Taxonomy from '@core/survey/taxonomy'
import * as TaxonomyManager from '@server/modules/taxonomy/manager/taxonomyManager'

export class TaxonomyBuilder {
  constructor(name, ...taxonBuilders) {
    this.name = name
    this.taxonBuilders = taxonBuilders
  }

  build() {
    const taxonomy = Taxonomy.newTaxonomy({
      [Taxonomy.keysProps.name]: this.name,
    })

    const taxa = this.taxonBuilders.map((taxonBuilder) => taxonBuilder.build(taxonomy))

    return {
      taxonomy,
      taxa,
    }
  }

  async buildAndStore(user, surveyId, t) {
    const { taxonomy, taxa } = this.build()

    await TaxonomyManager.insertTaxonomy({ user, surveyId, taxonomy, system: false }, t)
    await TaxonomyManager.insertTaxa({ user, surveyId, taxa }, t)
  }
}
