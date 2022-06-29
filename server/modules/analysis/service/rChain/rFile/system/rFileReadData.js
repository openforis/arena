import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import * as ApiRoutes from '@common/apiRoutes'
import * as PromiseUtils from '@core/promiseUtils'

import RFileSystem from './rFileSystem'
import { dfVar, setVar, arenaGet, asCharacter, asLogical, asNumeric } from '../../rFunctions'

const dataTypeConvertersByNodeDefType = {
  [NodeDef.nodeDefType.boolean]: asLogical,
  [NodeDef.nodeDefType.code]: asCharacter,
  [NodeDef.nodeDefType.coordinate]: asCharacter,
  [NodeDef.nodeDefType.date]: asCharacter,
  [NodeDef.nodeDefType.decimal]: asNumeric,
  [NodeDef.nodeDefType.integer]: asNumeric,
  [NodeDef.nodeDefType.taxon]: asCharacter,
  [NodeDef.nodeDefType.text]: asCharacter,
  [NodeDef.nodeDefType.time]: asCharacter,
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
    const contentConvertDataTypes = []

    Survey.visitAncestorsAndSelf(entityDef, (ancestorDef) => {
      Survey.getNodeDefChildren(
        ancestorDef,
        false
      )(survey).forEach((childDef) => {
        if (NodeDef.isSingleAttribute(childDef)) {
          contentConvertDataTypes.push(...this.createContentToConvertNodeDefColumnsDataTypes({ entityDef, childDef }))
        }
      })
    })(survey)
    await this.appendContent(...contentConvertDataTypes)
  }

  createContentToConvertNodeDefColumnsDataTypes({ entityDef, childDef }) {
    const content = []
    const dfEntity = NodeDef.getName(entityDef)
    const columnNames = NodeDefTable.getColumnNames(childDef)
    columnNames.forEach((columnName) => {
      const nodeDefDfVar = dfVar(dfEntity, columnName)
      const dataTypeConverter = dataTypeConvertersByNodeDefType[NodeDef.getType(childDef)]
      if (dataTypeConverter) {
        content.push(setVar(nodeDefDfVar, dataTypeConverter(nodeDefDfVar)))
      }
    })
    return content
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
