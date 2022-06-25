import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import * as ApiRoutes from '@common/apiRoutes'
import * as PromiseUtils from '@core/promiseUtils'

import RFileSystem from './rFileSystem'
import { dfVar, setVar, arenaGet, asCharacter, asLogical, asNumeric } from '../../rFunctions'

const dataTypeConvertersByNodeDefType = {
  [NodeDef.nodeDefType.boolean]: asLogical,
  [NodeDef.nodeDefType.decimal]: asNumeric,
  [NodeDef.nodeDefType.integer]: asNumeric,
  [NodeDef.nodeDefType.text]: asCharacter,
}

export default class RFileReadData extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'read-data')
  }

  async initEntitiesNodeDefs(entitiesNodeDefs) {
    const { chainUuid, survey, cycle } = this.rChain

    await PromiseUtils.each(entitiesNodeDefs, async (entityDef) => {
      // Fetch entity data
      const getEntityData = arenaGet(
        ApiRoutes.rChain.entityData({
          surveyId: Survey.getId(survey),
          cycle,
          chainUuid,
          entityUuid: NodeDef.getUuid(entityDef),
        })
      )
      const dfEntity = NodeDef.getName(entityDef)
      await this.appendContent(setVar(dfEntity, getEntityData))

      await this.appendContentToConvertDataTypes({ entityDef })
    })
  }

  async appendContentToConvertDataTypes({ entityDef }) {
    const { survey } = this.rChain
    const dfEntity = NodeDef.getName(entityDef)

    const contentConvertDataTypes = []

    Survey.visitAncestorsAndSelf(entityDef, (ancestorDef) => {
      Survey.getNodeDefChildren(
        ancestorDef,
        false
      )(survey).forEach((nodeDef) => {
        const nodeDefDfVar = dfVar(dfEntity, NodeDefTable.getColumnName(nodeDef))
        const dataTypeConverter = dataTypeConvertersByNodeDefType[NodeDef.getType(nodeDef)]
        if (dataTypeConverter) {
          contentConvertDataTypes.push(setVar(nodeDefDfVar, dataTypeConverter(nodeDefDfVar)))
        }
      })
    })(survey)
    await this.appendContent(...contentConvertDataTypes)
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
