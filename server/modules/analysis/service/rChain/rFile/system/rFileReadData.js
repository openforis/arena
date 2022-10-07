import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { ViewDataNodeDef } from '@common/model/db'
import * as ApiRoutes from '@common/apiRoutes'
import * as PromiseUtils from '@core/promiseUtils'

import RFileSystem from './rFileSystem'
import {
  setVar,
  arenaGetCSV,
  arenaDfColumnsAsCharacter,
  arenaDfColumnsAsLogical,
  arenaDfColumnsAsNumeric,
} from '../../rFunctions'

export default class RFileReadData extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'read-data')
  }

  async initEntitiesData() {
    const { chainUuid, survey, cycle, entities } = this.rChain

    await PromiseUtils.each(entities, async (entityDef) => {
      // Fetch entity data
      const dfName = NodeDef.getName(entityDef)
      const dataCSV = arenaGetCSV(
        ApiRoutes.rChain.entityData({
          surveyId: Survey.getId(survey),
          cycle,
          chainUuid,
          entityUuid: NodeDef.getUuid(entityDef),
        })
      )
      await this.appendContent(setVar(dfName, dataCSV))
      await this.appendContentToConvertDataTypes({ entityDef })

      await this.initMultipleAttributesData({ entityDef })
    })
  }

  async initMultipleAttributesData({ entityDef }) {
    const { chainUuid, survey, cycle } = this.rChain

    const multipleAttrDefs = Survey.getNodeDefChildren(entityDef, false)(survey).filter(NodeDef.isMultipleAttribute)
    await PromiseUtils.each(multipleAttrDefs, async (multipleAttrDef) => {
      const dfName = NodeDef.getName(multipleAttrDef)
      const dataCSV = arenaGetCSV(
        ApiRoutes.rChain.multipleAttributeData({
          surveyId: Survey.getId(survey),
          cycle,
          chainUuid,
          attributeDefUuid: NodeDef.getUuid(multipleAttrDef),
        })
      )
      await this.appendContent(setVar(dfName, dataCSV))
    })
  }

  async appendContentToConvertDataTypes({ entityDef }) {
    const { survey } = this.rChain

    const viewDataNodeDef = new ViewDataNodeDef(survey, entityDef)

    const columnsToConvertAsCharacter = []
    const columnsToConvertAsLogical = []
    const columnsToConvertAsNumeric = []

    viewDataNodeDef.columnNodeDefs.map((columnNodeDef) => {
      const { nodeDef, names: columnNames } = columnNodeDef
      columnNames.forEach((colName) => {
        if (NodeDef.isSingleAttribute(nodeDef) && !NodeDef.isAnalysis(nodeDef)) {
          const type = NodeDef.getType(nodeDef)
          if (NodeDef.isBoolean(nodeDef)) {
            columnsToConvertAsLogical.push(colName)
          } else if (
            [
              NodeDef.nodeDefType.code,
              NodeDef.nodeDefType.coordinate,
              NodeDef.nodeDefType.date,
              NodeDef.nodeDefType.taxon,
              NodeDef.nodeDefType.text,
              NodeDef.nodeDefType.time,
            ].includes(type)
          ) {
            columnsToConvertAsCharacter.push(colName)
          } else if ([NodeDef.nodeDefType.decimal, NodeDef.nodeDefType.integer].includes(type)) {
            columnsToConvertAsNumeric.push(colName)
          }
        }
      })
    })
    const dfEntity = NodeDef.getName(entityDef)

    const content = []
    if (columnsToConvertAsCharacter.length > 0) {
      content.push(setVar(dfEntity, arenaDfColumnsAsCharacter(dfEntity, columnsToConvertAsCharacter)))
    }
    if (columnsToConvertAsLogical.length > 0) {
      content.push(setVar(dfEntity, arenaDfColumnsAsLogical(dfEntity, columnsToConvertAsLogical)))
    }
    if (columnsToConvertAsNumeric.length > 0) {
      content.push(setVar(dfEntity, arenaDfColumnsAsNumeric(dfEntity, columnsToConvertAsNumeric)))
    }
    if (content.length > 0) {
      await this.appendContent(...content)
    }
  }

  async init() {
    await super.init()

    const { listCategories, listTaxonomies } = this.rChain

    await this.initEntitiesData()

    // Append categories and taxoniomies initialization
    await this.appendContent(...listCategories.scripts)
    await this.appendContent(...listTaxonomies.scripts)

    return this
  }
}
