import * as Survey from '@core/survey/survey'
import * as NodeDef from '../../../../../core/survey/nodeDef'

import TableSurveyRdb from '../tableSurveyRdb'
import * as SQL from '../../sql'

const tableNamePrefix = 'olap_data'

const includedAttributeTypes = [NodeDef.nodeDefType.boolean, NodeDef.nodeDefType.code, NodeDef.nodeDefType.taxon]

const commonColumnSet = {
  baseUnitUuid: 'base_unit_uuid',
  expFactor: 'exp_factor_',
}

const commonColumnNamesAndTypes = [
  `${commonColumnSet.baseUnitUuid}  ${SQL.types.uuid}       NOT NULL`,
  `${commonColumnSet.expFactor}     ${SQL.types.decimal}`,
]

export default class TableOlapData extends TableSurveyRdb {
  constructor(survey, reportingEntityDef) {
    super(Survey.getId(survey), `${tableNamePrefix}_${NodeDef.getName(reportingEntityDef)}`)
    this._survey = survey
    this._reportingEntityDef = reportingEntityDef
  }

  get attributeDefsForColumns() {
    return Survey.getNodeDefDescendantAttributesInSingleEntities({
      nodeDef: this._reportingEntityDef,
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
      ...commonColumnNamesAndTypes,
      ...this.attributeDefsForColumns.map((attrDef) => `${NodeDef.getName(attrDef)} ${SQL.types.varchar}`),
    ]
  }
}
