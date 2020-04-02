import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import RFileSystem from './rFileSystem'
import { setVar, arenaGet } from '../../rFunctions'

export const getDfCategoryItems = (category) => `category_items_${Category.getName(category)}`

export default class RFileReadData extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'read-data')
  }

  async init() {
    await super.init()

    const { survey, chain, cycle } = this.rChain
    const surveyId = Survey.getId(survey)
    const steps = ProcessingChain.getProcessingSteps(chain)

    await Promise.all(
      steps.map(async (step) => {
        if (ProcessingStep.hasEntity(step)) {
          const nodeDefEntity = Survey.getNodeDefByUuid(ProcessingStep.getEntityUuid(step))(survey)
          const nodeDefAttrCalculations = ProcessingStep.getCalculations(step).map((calculation) => {
            const nodeDefUuid = ProcessingStepCalculation.getNodeDefUuid(calculation)
            return Survey.getNodeDefByUuid(nodeDefUuid)(survey)
          })

          await Promise.all(
            nodeDefAttrCalculations.filter(NodeDef.isCode).map((nodeDef) => this._appendCategoryItems(nodeDef))
          )

          // Fetch entity data
          const getEntityData = arenaGet(
            `/survey/${surveyId}/rChain/steps/${ProcessingStep.getUuid(step)}?cycle=${cycle}`
          )
          const setEntityData = setVar(NodeDef.getName(nodeDefEntity), getEntityData)
          await this.appendContent(setEntityData)
        }
      })
    )

    return this
  }

  /**
   * Fetch category items and store them in a data frame called 'categoryName'
   */
  async _appendCategoryItems(nodeDef) {
    const { survey } = this.rChain
    const defaultLang = R.pipe(Survey.getSurveyInfo, Survey.getDefaultLanguage)(survey)
    const surveyId = Survey.getId(survey)

    const nodeDefName = NodeDef.getName(nodeDef)
    const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
    const category = Survey.getCategoryByUuid(categoryUuid)(survey)

    const dfCategoryItems = getDfCategoryItems(category)

    await this.appendContent(
      // Fetch category items
      setVar(
        dfCategoryItems,
        arenaGet(`/survey/${surveyId}/rChain/categories/${categoryUuid}?language=${defaultLang}`)
      ),
      // Rename data frame columns
      `names(${dfCategoryItems}) <- c('${nodeDefName}_item_uuid', '${nodeDefName}', '${nodeDefName}_item_label')`
    )
  }
}
