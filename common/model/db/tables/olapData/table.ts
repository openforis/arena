import type { NodeDef as ArenaNodeDef, NodeDefType, Survey as ArenaSurvey } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as StringUtils from '@core/stringUtils'

import TableSurveyRdb from '../tableSurveyRdb'
import * as SQL from '../../sql'

type AnyNodeDef = ArenaNodeDef<NodeDefType>

const tableNamePrefix = 'olap_data'

const includedAttributeTypes = new Set([
  NodeDef.nodeDefType.boolean,
  NodeDef.nodeDefType.code,
  NodeDef.nodeDefType.taxon,
])
const includedAnalysisAttributeTypes = new Set([NodeDef.nodeDefType.integer, NodeDef.nodeDefType.decimal])

const baseColumnSet = {
  id: 'id',
  expFactor: 'exp_factor_',
}

const baseColumnNamesAndTypes = [
  `${baseColumnSet.id}            ${SQL.types.bigint}     NOT NULL GENERATED ALWAYS AS IDENTITY`,
  `${baseColumnSet.expFactor}     ${SQL.types.decimal}`,
]

const generateTableName = ({ cycle, entityDef }: { cycle: string; entityDef: AnyNodeDef }): string =>
  `${tableNamePrefix}_cycle_${cycle}_${NodeDef.getName(entityDef)}`

export default class TableOlapData extends TableSurveyRdb {
  static readonly baseColumnSet = baseColumnSet
  static readonly tableNamePrefix = tableNamePrefix

  private readonly _survey: ArenaSurvey
  private readonly _entityDef: AnyNodeDef
  private readonly _baseUnitDef: AnyNodeDef

  constructor({
    survey,
    cycle,
    entityDef,
    baseUnitDef,
  }: {
    survey: ArenaSurvey
    cycle: string
    entityDef: AnyNodeDef
    baseUnitDef: AnyNodeDef
  }) {
    super(Survey.getId(survey), generateTableName({ cycle, entityDef }))
    this._survey = survey
    this._entityDef = entityDef
    this._baseUnitDef = baseUnitDef
  }

  get attributeDefsForColumns(): AnyNodeDef[] {
    const sortedAttributeDefs: AnyNodeDef[] = []
    const attributeDefsByUuid: Record<string, AnyNodeDef> = {}
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
              includedAttributeTypes.has(NodeDef.getType(nodeDef)))) ||
          (NodeDef.isAnalysis(nodeDef) && includedAnalysisAttributeTypes.has(NodeDef.getType(nodeDef)))
      )
      for (const nodeDef of filteredDefs) {
        const uuid = NodeDef.getUuid(nodeDef)
        if (!attributeDefsByUuid[uuid]) {
          attributeDefsByUuid[uuid] = nodeDef
          sortedAttributeDefs.unshift(nodeDef)
        }
      }
    })(this._survey)
    return sortedAttributeDefs
  }

  get columnNames(): string[] {
    return [
      // base columns
      ...Object.values(baseColumnSet),
      // base unit UUID
      this.baseUnitUuidColumnName,
      // attribute columns
      ...this.attributeDefsForColumns.map(NodeDef.getName),
    ]
  }

  get columnNamesForInsert(): string[] {
    return this.columnNames.filter((columnName) => columnName !== baseColumnSet.id)
  }

  get requiredColumnNamesForInsert(): string[] {
    return [
      // base columns
      baseColumnSet.expFactor,
      // base unit UUID
      this.baseUnitUuidColumnName,
      // key attribute columns
      ...this.attributeDefsForColumns.filter(NodeDef.isKey).map(NodeDef.getName),
    ]
  }

  get baseUnitUuidColumnName(): string {
    return NodeDef.getName(this._baseUnitDef) + '_uuid'
  }

  get columnNamesAndTypes(): string[] {
    return [
      // base columns
      ...baseColumnNamesAndTypes,
      // base unit UUID
      `${StringUtils.quoteDouble(this.baseUnitUuidColumnName)} ${SQL.types.uuid}`,
      // attribute columns
      ...this.attributeDefsForColumns.map(
        (attrDef) => `${StringUtils.quoteDouble(NodeDef.getName(attrDef))} ${SQL.types.varchar}`
      ),
    ]
  }
}
