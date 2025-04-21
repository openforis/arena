import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import TableSurveyRdb from '../tableSurveyRdb'
import * as SQL from '../../sql'

const tableNamePrefix = 'olap_data'

const includedAttributeTypes = [NodeDef.nodeDefType.boolean, NodeDef.nodeDefType.code, NodeDef.nodeDefType.taxon]

const baseColumnSet = {
  id: 'id',
  expFactor: 'exp_factor_',
}

const baseColumnNamesAndTypes = [
  `${baseColumnSet.id}            ${SQL.types.bigint}     NOT NULL GENERATED ALWAYS AS IDENTITY`,
  `${baseColumnSet.expFactor}     ${SQL.types.decimal}`,
]

const generateTableName = ({ cycle, entityDef }) => `${tableNamePrefix}_cycle_${cycle}_${NodeDef.getName(entityDef)}`

export default class TableOlapData extends TableSurveyRdb {
  constructor({ survey, cycle, entityDef, baseUnitDef }) {
    super(Survey.getId(survey), generateTableName({ cycle, entityDef }))
    this._survey = survey
    this._entityDef = entityDef
    this._baseUnitDef = baseUnitDef
  }

  get attributeDefsForColumns() {
    const ancestorAndDescendantAttributeDefs = []
    Survey.visitAncestorsAndSelf(this._entityDef, (ancestorDef) => {
      ancestorAndDescendantAttributeDefs.unshift(
        ...Survey.getNodeDefDescendantAttributesInSingleEntities({
          nodeDef: ancestorDef,
          includeAnalysis: true,
          includeSamplingDefsWithoutSiblings: true,
        })(this._survey)
      )
    })(this._survey)
    return ancestorAndDescendantAttributeDefs
      .filter(
        (nodeDef) => NodeDef.isSingleAttribute(nodeDef) && includedAttributeTypes.includes(NodeDef.getType(nodeDef))
      )
      .sort((nodeDefA, nodeDefB) => NodeDef.getId(nodeDefA) - NodeDef.getId(nodeDefB))
  }

  get columnNames() {
    return [
      // base columns
      ...Object.values(baseColumnSet),
      // base unit UUID
      this.baseUnitUuidColumnName,
      // attribute columns
      ...this.attributeDefsForColumns.map(NodeDef.getName),
    ]
  }

  get columnNamesForInsert() {
    return this.columnNames.filter((columnName) => columnName !== baseColumnSet.id)
  }

  get baseUnitUuidColumnName() {
    return NodeDef.getName(this._baseUnitDef) + '_uuid'
  }

  get columnNamesAndTypes() {
    return [
      // base columns
      ...baseColumnNamesAndTypes,
      // base unit UUID
      `${this.baseUnitUuidColumnName} ${SQL.types.uuid}`,
      // attribute columns
      ...this.attributeDefsForColumns.map((attrDef) => `${NodeDef.getName(attrDef)} ${SQL.types.varchar}`),
    ]
  }
}

TableOlapData.baseColumnSet = baseColumnSet
