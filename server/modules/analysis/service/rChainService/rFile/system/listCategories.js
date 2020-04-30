import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'
import * as ApiRoutes from '@common/apiRoutes'

import { arenaGet, dfVar, setVar } from '../../rFunctions'

export default class ListCategories {
  constructor(rChain) {
    this._rChain = rChain
    this._scripts = []
    this._name = 'categories'

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
    const language = R.pipe(Survey.getSurveyInfo, Survey.getDefaultLanguage)(survey)

    const category = Survey.getCategoryByUuid(categoryUuid)(survey)

    const dfCategoryItems = this.getDfCategoryItems(category)
    const getCategoryItems = arenaGet(ApiRoutes.rChain.categoryItemsData(Survey.getId(survey), categoryUuid), {
      language: `'${language}'`,
    })

    this.scripts.push(setVar(dfCategoryItems, getCategoryItems))
  }

  initList() {
    const { survey, chain } = this.rChain

    // Get unique category uuids from processing step calculations
    const categoryUuids = new Set()
    ProcessingChain.getProcessingSteps(chain).forEach((step) => {
      const calculations = ProcessingStep.getCalculations(step)
      calculations.forEach((calculation) => {
        const nodeDef = Survey.getNodeDefByUuid(ProcessingStepCalculation.getNodeDefUuid(calculation))(survey)
        if (NodeDef.isCode(nodeDef)) {
          categoryUuids.add(NodeDef.getCategoryUuid(nodeDef))
        }
      })
    })

    // Init categories named list
    this.scripts.push(setVar(this.name, 'list()'))
    // Init categories
    categoryUuids.forEach((categoryUuid) => this.initCategory(categoryUuid))
  }
}
