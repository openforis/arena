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
    this._extra = {}
  }

  vernacularName(lang, name) {
    this.vernacularNames = R.pipe(
      R.propOr([], lang),
      R.append(TaxonVernacularName.newTaxonVernacularName(lang, name))
    )(this.vernacularNames)
    return this
  }

  extra(key, value) {
    this._extra[key] = value
    return this
  }

  build(taxonomy) {
    return Taxon.newTaxon({
      taxonomyUuid: Taxonomy.getUuid(taxonomy),
      code: this.code,
      family: this.family,
      genus: this.genus,
      scientificName: this.scientificName,
      vernacularNames: this.vernacularNames,
      extra: this._extra,
    })
  }
}
