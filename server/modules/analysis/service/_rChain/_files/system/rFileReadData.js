import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'
import * as Category from '@core/survey/category'

import { RFileSystem } from '@server/modules/analysis/service/_rChain/rFile'
import { setVar, arenaGet } from '@server/modules/analysis/service/_rChain/rFunctions'

export const getDfCategoryItems = category => `category_items_${Category.getName(category)}`

export default class RFileReadData extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'read-data')
  }

  async init() {
    await super.init()

    const survey = this.rChain.survey
    const surveyId = Survey.getId(survey)
    const cycle = this.rChain.cycle
    const steps = ProcessingChain.getProcessingSteps(this.rChain.chain)

    for (const step of steps) {
      if (ProcessingStep.hasEntity(step)) {
        const entityDef = Survey.getNodeDefByUuid(ProcessingStep.getEntityUuid(step))(survey)
        const calculationAttrDefs = R.pipe(
          ProcessingStep.getCalculations,
          R.map(
            R.pipe(ProcessingStepCalculation.getNodeDefUuid, nodeDefUuid =>
              Survey.getNodeDefByUuid(nodeDefUuid)(survey),
            ),
          ),
        )(step)

        // Fetch category items
        for (const nodeDef of calculationAttrDefs) {
          if (NodeDef.isCode(nodeDef)) {
            await this._fetchCategoryItemsByNodeDef(nodeDef)
          }
        }

        // Fetch entity data
        const getEntityData = arenaGet(
          `/survey/${surveyId}/rChain/steps/${ProcessingStep.getUuid(step)}?cycle=${cycle}`,
        )
        const setEntityData = setVar(NodeDef.getName(entityDef), getEntityData)
        await this.appendContent(setEntityData)
      }
    }

    return this
  }

  /**
   * Fetch category items and store them in a data frame called 'categoryName'
   */
  async _fetchCategoryItemsByNodeDef(nodeDef) {
    const survey = this.rChain.survey
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
        arenaGet(`/survey/${surveyId}/rChain/categories/${categoryUuid}?language=${defaultLang}`),
      ),
      // Rename data frame columns
      `names(${dfCategoryItems}) <- c('${nodeDefName}_item_uuid', '${nodeDefName}', '${nodeDefName}_item_label')`,
    )
  }
}
