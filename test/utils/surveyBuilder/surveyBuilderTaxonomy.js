import * as R from 'ramda'

import * as Taxonomy from '@core/survey/taxonomy'
import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'
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

export class TaxonBuilder {
  constructor(code, family, genus, scientificName) {
    this.code = code
    this.family = family
    this.genus = genus
    this.scientificName = scientificName
    this.vernacularNames = {}
  }

  vernacularName(lang, name) {
    this.vernacularNames = R.pipe(
      R.propOr([], lang),
      R.append(TaxonVernacularName.newTaxonVernacularName(lang, name))
    )(this.vernacularNames)
    return this
  }

  build(taxonomy) {
    return Taxon.newTaxon(
      Taxonomy.getUuid(taxonomy),
      this.code,
      this.family,
      this.genus,
      this.scientificName,
      this.vernacularNames
    )
  }
}
