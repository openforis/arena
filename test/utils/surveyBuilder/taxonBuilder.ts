import type { ArenaVernacularName } from '@openforis/arena-core'

import * as Taxon from '@core/survey/taxon'
import * as Taxonomy from '@core/survey/taxonomy'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'

export class TaxonBuilder {
  code: string
  family: string
  genus: string
  scientificName: string
  vernacularNames: Record<string, ArenaVernacularName[]>
  _extra: Record<string, unknown>

  constructor(code: string, family: string, genus: string, scientificName: string) {
    this.code = code
    this.family = family
    this.genus = genus
    this.scientificName = scientificName
    this.vernacularNames = {}
    this._extra = {}
  }

  vernacularName(lang: string, name: string) {
    const names = this.vernacularNames[lang] ?? []
    this.vernacularNames = {
      ...this.vernacularNames,
      [lang]: [...names, TaxonVernacularName.newTaxonVernacularName(lang, name)],
    }
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
