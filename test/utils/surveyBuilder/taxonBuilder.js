import * as R from 'ramda'

import * as Taxonomy from '@core/survey/taxonomy'
import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'

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
