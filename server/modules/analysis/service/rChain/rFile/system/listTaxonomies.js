import * as Survey from '@core/survey/survey'
import * as Taxonomy from '@core/survey/taxonomy'
import * as ApiRoutes from '@common/apiRoutes'

import { arenaGet, dfVar, setVar } from '../../rFunctions'

export default class ListTaxonomies {
  constructor(rChain) {
    this._rChain = rChain
    this._scripts = []
    this._name = 'taxonomies'
    this._taxonomies = []

    this.initList()
  }

  get rChain() {
    return this._rChain
  }

  get name() {
    return this._name
  }

  get scripts() {
    return this._scripts
  }

  getDfTaxonomyItems(taxonomy) {
    return dfVar(this.name, Taxonomy.getName(taxonomy))
  }

  initTaxonomy(taxonomy) {
    const { survey } = this.rChain
    const language = Survey.getDefaultLanguage(Survey.getSurveyInfo(survey))
    const taxonomyUuid = Taxonomy.getUuid(taxonomy)

    // get taxa
    const dfTaxonomyyItems = this.getDfTaxonomyItems(taxonomy)
    const getTaxonomyItems = arenaGet(ApiRoutes.rChain.taxonomyItemsData(Survey.getId(survey), taxonomyUuid), {
      language: `'${language}'`,
    })

    this.scripts.push(setVar(dfTaxonomyyItems, getTaxonomyItems))
  }

  initTaxonomies() {
    // Init taxonomies named list
    this.scripts.push(setVar(this.name, 'list()'))
    this._taxonomies.forEach((taxonomy) => this.initTaxonomy(taxonomy))
  }

  initList() {
    const { survey } = this.rChain
    this._taxonomies = Survey.getTaxonomiesArray(survey)
    this.initTaxonomies()
  }
}
