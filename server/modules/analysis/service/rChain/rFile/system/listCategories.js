import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as ApiRoutes from '@common/apiRoutes'

import { arenaGet, dfVar, setVar } from '../../rFunctions'

const getCategoryUuidsInChain = ({ survey, chain }) => {
  // Get unique category uuids for ChainNodeDefs
  const categoryUuids = new Set()

  ProcessingChain.getChainNodeDefs(chain).forEach((chainNodeDef) => {
    const nodeDef = Survey.getNodeDefByUuid(chainNodeDef.node_def_uuid)(survey)
    if (NodeDef.isCode(nodeDef)) {
      categoryUuids.add(NodeDef.getCategoryUuid(nodeDef))
    }
  })
  return categoryUuids
}

export default class ListCategories {
  constructor(rChain) {
    this._rChain = rChain
    this._scripts = []
    this._name = 'categories'
    this._categoryUuids = []

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

  getDfCategoryItems(category) {
    return dfVar(this.name, Category.getName(category))
  }

  initCategory(categoryUuid) {
    const { survey } = this.rChain
    const language = Survey.getDefaultLanguage(Survey.getSurveyInfo(survey))
    const category = Survey.getCategoryByUuid(categoryUuid)(survey)

    // get category items
    const dfCategoryItems = this.getDfCategoryItems(category)
    const getCategoryItems = arenaGet(ApiRoutes.rChain.categoryItemsData(Survey.getId(survey), categoryUuid), {
      language: `'${language}'`,
    })

    this.scripts.push(setVar(dfCategoryItems, getCategoryItems))
  }

  initCategories() {
    // Init categories named list
    this.scripts.push(setVar(this.name, 'list()'))
    this._categoryUuids.forEach((categoryUuid) => this.initCategory(categoryUuid))
  }

  initList() {
    const { survey, chain } = this.rChain
    this._categoryUuids = getCategoryUuidsInChain({ survey, chain })
    this.initCategories()
  }
}
