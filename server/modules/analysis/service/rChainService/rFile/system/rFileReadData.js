import * as R from 'ramda'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'
import * as ApiRoutes from '@common/apiRoutes'

import RFileSystem from './rFileSystem'
import { setVar, arenaGet } from '../../rFunctions'

export const getDfCategoryItems = (category) => `category_items_${Category.getName(category)}`

export default class RFileReadData extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'read-data')
  }

  async initCategory(nodeDef) {
    const { survey } = this.rChain
    const language = R.pipe(Survey.getSurveyInfo, Survey.getDefaultLanguage)(survey)

    const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
    const category = Survey.getCategoryByUuid(categoryUuid)(survey)

    const dfCategoryItems = getDfCategoryItems(category)
    const getCategoryItems = arenaGet(ApiRoutes.rChain.categoryItemsData(Survey.getId(survey), categoryUuid), {
      language: `'${language}'`,
    })

    await this.appendContent(setVar(dfCategoryItems, getCategoryItems))
  }

  async initCategories(step) {
    const { survey } = this.rChain
    const calculations = ProcessingStep.getCalculations(step)

    const attributeDefs = calculations.reduce((nodeDefs, calculation) => {
      const nodeDef = Survey.getNodeDefByUuid(ProcessingStepCalculation.getNodeDefUuid(calculation))(survey)
      if (NodeDef.isCode(nodeDef)) {
        nodeDefs.push(nodeDef)
      }
      return nodeDefs
    }, [])

    await Promise.all(attributeDefs.map(this.initCategory))
  }

  async initSteps(steps) {
    const { survey, cycle } = this.rChain

    await Promise.all(
      steps.map(async (step) => {
        await this.initCategories(step)

        // Fetch entity data
        const getEntityData = arenaGet(
          ApiRoutes.rChain.stepEntityData(Survey.getId(survey), cycle, ProcessingStep.getUuid(step))
        )
        const entityDef = Survey.getNodeDefByUuid(ProcessingStep.getEntityUuid(step))(survey)
        const setEntityData = setVar(NodeDef.getName(entityDef), getEntityData)
        await this.appendContent(setEntityData)
      })
    )
  }

  async init() {
    await super.init()
    this.initSteps = this.initSteps.bind(this)
    this.initCategories = this.initCategories.bind(this)
    this.initCategory = this.initCategory.bind(this)

    const { chain } = this.rChain
    const steps = ProcessingChain.getProcessingSteps(chain).filter(ProcessingStep.hasEntity)
    await this.initSteps(steps)

    return this
  }
}
