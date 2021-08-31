import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import * as ApiRoutes from '@common/apiRoutes'
import * as PromiseUtils from '@core/promiseUtils'

import RFileSystem from './rFileSystem'
import { dfVar, setVar, arenaGet, asNumeric } from '../../rFunctions'

export default class RFileReadData extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'read-data')
  }

  async initEntitiesNodeDefs(entitiesNodeDefs) {
    const { chainUuid, survey, cycle } = this.rChain

    await PromiseUtils.each(entitiesNodeDefs, async (entityDef) => {
      // Fetch entity data
      const getEntityData = arenaGet(
        ApiRoutes.rChain.entityData(Survey.getId(survey), cycle, chainUuid, NodeDef.getUuid(entityDef))
      )
      const dfEntity = NodeDef.getName(entityDef)
      await this.appendContent(setVar(dfEntity, getEntityData))

      // Convert numeric node def values
      const contentConvertNumericFields = []
      Survey.visitAncestorsAndSelf(entityDef, (ancestorDef) => {
        Survey.getNodeDefChildren(ancestorDef)(survey)
          .filter((nodeDef) => NodeDef.isDecimal(nodeDef) || NodeDef.isInteger(nodeDef))
          .filter(!NodeDef.isAnalysis)
          .forEach((nodeDef) => {
            const nodeDefDfVar = dfVar(dfEntity, NodeDefTable.getColumnName(nodeDef))
            contentConvertNumericFields.push(setVar(nodeDefDfVar, asNumeric(nodeDefDfVar)))
          })
      })(survey)
      await this.appendContent(...contentConvertNumericFields)
    })
  }

  async init() {
    await super.init()
    this.initEntitiesNodeDefs = this.initEntitiesNodeDefs.bind(this)

    const { listCategories, listTaxonomies, entities } = this.rChain

    await this.initEntitiesNodeDefs(entities)

    // Append categories and taxoniomies initialization
    await this.appendContent(...listCategories.scripts)
    await this.appendContent(...listTaxonomies.scripts)

    return this
  }
}
