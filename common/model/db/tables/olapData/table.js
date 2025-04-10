import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import TableSurveyRdb from '../tableSurveyRdb'
import * as SQL from '../../sql'

const tableNamePrefix = 'olap_data'

const includedAttributeTypes = [NodeDef.nodeDefType.boolean, NodeDef.nodeDefType.code, NodeDef.nodeDefType.taxon]

const baseColumnSet = {
  id: 'id',
  baseUnitUuid: 'base_unit_uuid',
  expFactor: 'exp_factor_',
}

const baseColumnNamesAndTypes = [
  `${baseColumnSet.id}            ${SQL.types.bigint}     NOT NULL GENERATED ALWAYS AS IDENTITY`,
  `${baseColumnSet.baseUnitUuid}  ${SQL.types.uuid}       NOT NULL`,
  `${baseColumnSet.expFactor}     ${SQL.types.decimal}`,
]

const generateTableName = ({ cycle, chainId, entityDef }) =>
  `${tableNamePrefix}_cycle_${cycle}_chain_${chainId}_${NodeDef.getName(entityDef)}`

export default class TableOlapData extends TableSurveyRdb {
  constructor({ survey, cycle, chainId, entityDef }) {
    super(Survey.getId(survey), generateTableName({ cycle, chainId, entityDef }))
    this._survey = survey
    this._entityDef = entityDef
  }

  get attributeDefsForColumns() {
    return Survey.getNodeDefDescendantAttributesInSingleEntities({
      nodeDef: this._entityDef,
      includeAnalysis: true,
      includeSamplingDefsWithoutSiblings: true,
    })(this._survey)
      .filter(
        (nodeDef) => NodeDef.isSingleAttribute(nodeDef) && includedAttributeTypes.includes(NodeDef.getType(nodeDef))
      )
      .sort((nodeDefA, nodeDefB) => NodeDef.getId(nodeDefA) - NodeDef.getId(nodeDefB))
  }

  get columnNamesAndTypes() {
    return [
      ...baseColumnNamesAndTypes,
      ...this.attributeDefsForColumns.map((attrDef) => `${NodeDef.getName(attrDef)} ${SQL.types.varchar}`),
    ]
  }
}

TableOlapData.baseColumnSet = baseColumnSet
