import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as ApiRoutes from '@common/apiRoutes'

import { arenaGetCSV, dfVar, setVar } from '../../rFunctions'

export default class ListCategories {
  constructor(rChain) {
    this._rChain = rChain
    this._scripts = []
    this._name = 'categories'
    this._categories = []

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

  initCategory(category) {
    const { chainUuid, survey, token } = this.rChain

    const language = Survey.getDefaultLanguage(Survey.getSurveyInfo(survey))
    const categoryUuid = Category.getUuid(category)

    // get category items
    const dfCategoryItems = this.getDfCategoryItems(category)
    const getCategoryItems = arenaGetCSV(
      ApiRoutes.rChain.categoryItemsCsv({ surveyId: Survey.getId(survey), chainUuid, categoryUuid }),
      {
        language: `'${language}'`,
        token: `'${token}'`,
      }
    )

    this.scripts.push(setVar(dfCategoryItems, getCategoryItems))
  }

  initCategories() {
    // Init categories named list
    this.scripts.push(setVar(this.name, 'list()'))
    this._categories.forEach((category) => this.initCategory(category))
  }

  initList() {
    const { survey } = this.rChain
    this._categories = Survey.getCategoriesArray(survey)
    this.initCategories()
  }
}
