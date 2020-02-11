import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'

import * as DataTable from '@server/modules/surveyRdb/schemaRdb/dataTable'
import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'

import { RFileSystem } from '@server/modules/analysis/service/_rChain/rFile'
import { dbGetQuery, setVar } from '@server/modules/analysis/service/_rChain/rFunctions'

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

    const schema = SchemaRdb.getName(surveyId)

    for (const step of steps) {
      if (ProcessingStep.hasEntity(step)) {
        const entityDef = Survey.getNodeDefByUuid(ProcessingStep.getEntityUuid(step))(survey)
        const entityDefParent = Survey.getNodeDefParent(entityDef)(survey)
        const viewName = NodeDefTable.getViewName(entityDef, entityDefParent)
        const calculationAttrDefs = R.pipe(
          ProcessingStep.getCalculations,
          R.map(
            R.pipe(ProcessingStepCalculation.getNodeDefUuid, nodeDefUuid =>
              Survey.getNodeDefByUuid(nodeDefUuid)(survey),
            ),
          ),
        )(step)

        const fields = ['*']
        for (const nodeDef of calculationAttrDefs) {
          const nodeDefName = NodeDef.getName(nodeDef)
          // Add nodeDefName_uuid field
          fields.push(`uuid_generate_v4() as ${nodeDefName}_uuid`)

          if (NodeDef.isCode(nodeDef)) {
            await this._fetchCategoryItemsByNodeDef(nodeDef)
          }
        }

        const selectData = dbGetQuery(schema, viewName, fields.join(', '), [
          `${DataTable.colNameRecordCycle} = '${cycle}'`,
        ])
        const setEntityData = setVar(NodeDef.getName(entityDef), selectData)
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
    const surveyId = Survey.getId(survey)

    const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
    const category = await CategoryManager.fetchCategoryAndLevelsByUuid(surveyId, categoryUuid)
    const level = Category.getLevelByIndex(0)(category)
    const whereCond = `level_uuid = '${CategoryLevel.getUuid(level)}'`
    const selectCategoryItems = dbGetQuery(getSurveyDBSchema(surveyId), 'category_item', '*', [whereCond])
    await this.appendContent(setVar(Category.getName(category), selectCategoryItems))
  }
}
