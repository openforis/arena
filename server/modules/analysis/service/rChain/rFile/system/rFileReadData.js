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

const dataConversionTypes = {
  asCharacter: 'asCharacter',
  asLogical: 'asLogical',
  asNumeric: 'asNumeric',
}

const conversionTypeByNodeDefType = {
  [NodeDef.nodeDefType.boolean]: dataConversionTypes.asLogical,
  [NodeDef.nodeDefType.code]: dataConversionTypes.asCharacter,
  [NodeDef.nodeDefType.coordinate]: dataConversionTypes.asCharacter,
  [NodeDef.nodeDefType.date]: dataConversionTypes.asCharacter,
  [NodeDef.nodeDefType.decimal]: dataConversionTypes.asNumeric,
  [NodeDef.nodeDefType.integer]: dataConversionTypes.asNumeric,
  [NodeDef.nodeDefType.taxon]: dataConversionTypes.asCharacter,
  [NodeDef.nodeDefType.text]: dataConversionTypes.asCharacter,
  [NodeDef.nodeDefType.time]: dataConversionTypes.asCharacter,
}

const conversionFunctionByType = {
  [dataConversionTypes.asCharacter]: arenaDfColumnsAsCharacter,
  [dataConversionTypes.asLogical]: arenaDfColumnsAsLogical,
  [dataConversionTypes.asNumeric]: arenaDfColumnsAsNumeric,
}

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

    const columnsByConversionType = {}
    viewDataNodeDef.columnNodeDefs.forEach((columnNodeDef) => {
      if (
        !NodeDef.isSingleAttribute(columnNodeDef.nodeDef) ||
        NodeDef.isAnalysis(columnNodeDef.nodeDef) ||
        !conversionTypeByNodeDefType[NodeDef.getType(columnNodeDef.nodeDef)]
      )
        return

      const { nodeDef, names: columnNames } = columnNodeDef
      const conversionType = conversionTypeByNodeDefType[NodeDef.getType(nodeDef)]
      const columns = columnsByConversionType[conversionType] || []
      columns.push(...columnNames)
      columnsByConversionType[conversionType] = columns
    })

    const dfEntity = NodeDef.getName(entityDef)

    const content = []
    Object.entries(columnsByConversionType).forEach(([conversionType, columnNames]) => {
      if (columnNames.length === 0) return

      content.push(setVar(dfEntity, conversionFunctionByType[conversionType](dfEntity, columnNames)))
    })
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
