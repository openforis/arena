import * as R from 'ramda'

import * as PromiseUtils from '@core/promiseUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'
import * as ApiRoutes from '@common/apiRoutes'

import RFileSystem from './rFileSystem'
import { dfVar, setVar, arenaGet } from '../../rFunctions'

const dfCategories = 'categories'
export const getDfCategoryItems = (category) => dfVar(dfCategories, Category.getName(category))

export default class RFileReadCategories extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'read-categories')
  }

  async initCategory(categoryUuid) {
    const { survey } = this.rChain
    const language = R.pipe(Survey.getSurveyInfo, Survey.getDefaultLanguage)(survey)

    const category = Survey.getCategoryByUuid(categoryUuid)(survey)

    const dfCategoryItems = getDfCategoryItems(category)
    const getCategoryItems = arenaGet(ApiRoutes.rChain.categoryItemsData(Survey.getId(survey), categoryUuid), {
      language: `'${language}'`,
    })

    await this.appendContent(setVar(dfCategoryItems, getCategoryItems))
  }

  async init() {
    await super.init()

    const { survey, chain } = this.rChain

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
    await this.appendContent(setVar(dfCategories, 'list()'))
    // Fetch category items
    await PromiseUtils.each(Array.from(categoryUuids), (categoryUuid) => this.initCategory(categoryUuid))

    return this
  }
}
