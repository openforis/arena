import * as Taxonomy from '@core/survey/taxonomy'
import * as TaxonomyManager from '@server/modules/taxonomy/manager/taxonomyManager'

export class TaxonomyBuilder {
  constructor(name) {
    this.name = name
    this._extraProps = {}
  }

  extraProps(extraPropsDefs) {
    this._extraProps = extraPropsDefs
    return this
  }

  taxa(...taxonBuilders) {
    this.taxonBuilders = taxonBuilders
    return this
  }

  build() {
    const taxonomy = Taxonomy.newTaxonomy({
      [Taxonomy.keysProps.name]: this.name,
      [Taxonomy.keysProps.extraPropsDefs]: this._extraProps,
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
    await TaxonomyManager.insertTaxa({ user, surveyId, taxa, client: t })
  }
}
