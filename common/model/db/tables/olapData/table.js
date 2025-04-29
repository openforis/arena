import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import TableSurveyRdb from '../tableSurveyRdb'
import * as SQL from '../../sql'

const tableNamePrefix = 'olap_data'

const includedAttributeTypes = [NodeDef.nodeDefType.boolean, NodeDef.nodeDefType.code, NodeDef.nodeDefType.taxon]
const includedAnalysisAttributeTypes = [NodeDef.nodeDefType.integer, NodeDef.nodeDefType.decimal]

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
    const attributeDefs = []
    Survey.visitAncestorsAndSelf(this._entityDef, (ancestorDef) => {
      const defs = Survey.getNodeDefDescendantAttributesInSingleEntities({
        nodeDef: ancestorDef,
        includeAnalysis: true,
        includeSamplingDefsWithoutSiblings: true,
      })(this._survey)
      const filteredDefs = defs.filter(
        (nodeDef) =>
          (NodeDef.isSingleAttribute(nodeDef) &&
            ((NodeDef.isKey(nodeDef) && NodeDef.getParentUuid(nodeDef) !== NodeDef.getUuid(this._entityDef)) ||
              includedAttributeTypes.includes(NodeDef.getType(nodeDef)))) ||
          (NodeDef.isAnalysis(nodeDef) && includedAnalysisAttributeTypes.includes(NodeDef.getType(nodeDef)))
      )
      attributeDefs.unshift(...filteredDefs)
    })(this._survey)
    return attributeDefs
    //.sort((nodeDefA, nodeDefB) => NodeDef.getId(nodeDefA) - NodeDef.getId(nodeDefB))
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

  get requiredColumnNamesForInsert() {
    return [
      // base columns
      baseColumnSet.expFactor,
      // base unit UUID
      this.baseUnitUuidColumnName,
      // key attribute columns
      ...this.attributeDefsForColumns.filter(NodeDef.isKey).map(NodeDef.getName),
    ]
  }

  get baseUnitUuidColumnName() {
    return NodeDef.getName(this._baseUnitDef) + '_uuid'
  }

  get expFactorColumnName() {
    return baseColumnSet.expFactor
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
TableOlapData.tableNamePrefix = tableNamePrefix
