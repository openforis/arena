import { isUuid } from '../../../../../core/uuid'
import * as Survey from '../../../../../core/survey/survey'
import * as NodeDef from '../../../../../core/survey/nodeDef'
import * as Node from '../../../../../core/record/node'

import TableCategoryItem from '../categoryItem'
import TableTaxon from '../taxon'
import TableTaxonVernacularName from '../taxonVernacularName'
import { jsonBuildObject } from '../../sql'
import type Table from '../table'
import type TableNode from './table'

export type GetSelectParams = {
  uuid?: string | null
  recordUuid?: string | null
  parentUuid?: string | null
  nodeDefUuid?: string | null
  // include draft props (otherwise only published ones)
  draft?: boolean
}

// number of levels between the nodes of the given node def and the nodes of its first ancestor multiple entity
const _getLevelsFromAncestorMultipleEntity = ({
  survey,
  nodeDefUuid,
}: {
  survey: TableNode['survey']
  nodeDefUuid: string
}): number => {
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  const nodeDefAncestor = Survey.getNodeDefAncestorMultipleEntity(nodeDef)(survey)
  if (!nodeDefAncestor) return 1
  return NodeDef.getMetaHierarchy(nodeDef).length - NodeDef.getMetaHierarchy(nodeDefAncestor).length
}

// select query for the node table (bound to a TableNode instance)
export function getSelect(this: TableNode, params: GetSelectParams): string {
  const { uuid = null, recordUuid = null, parentUuid = null, nodeDefUuid = null, draft = false } = params

  const _getPropsCombined = (table: Table) =>
    draft ? `${table.columnProps} || ${table.columnPropsDraft}` : `${table.columnProps}`

  const tableCategoryItem = new TableCategoryItem(this.surveyId)
  const tableTaxon = new TableTaxon(this.surveyId)
  const tableTaxonVernacularName = new TableTaxonVernacularName(this.surveyId)

  const propsTaxon = _getPropsCombined(tableTaxon)
  const propsVernacularName = _getPropsCombined(tableTaxonVernacularName)
  const propsCategoryItem = _getPropsCombined(tableCategoryItem)

  const whereConditions = []

  const _addUuidEqualCondition = (column, value) => {
    if (value) {
      const valueSql = isUuid(value) ? `'${value}'` : value
      whereConditions.push(`${column} = ${valueSql}`)
    }
  }

  const _addParentNodeCondition = () => {
    const levels = nodeDefUuid ? _getLevelsFromAncestorMultipleEntity({ survey: this.survey, nodeDefUuid }) : 1
    if (!parentUuid || levels <= 1) {
      _addUuidEqualCondition(this.columnParentUuid, parentUuid)
      return
    }
    // node def is inside single entities: parentUuid is the uuid of the first ancestor multiple entity;
    // go down from it through the single entities (a1 is its child, a2 its grandchild, ...)
    const singleEntityAliases = Array.from({ length: levels - 1 }, (_, i) => `${this.alias}_a${i + 1}`)
    const [firstAlias] = singleEntityAliases
    const lastAlias = singleEntityAliases.at(-1)
    const joins = singleEntityAliases
      .slice(1)
      .map((alias, i) => `JOIN ${this.nameQualified} ${alias} ON ${alias}.parent_uuid = ${singleEntityAliases[i]}.uuid`)
    const parentUuidSql = isUuid(parentUuid) ? `'${parentUuid}'` : parentUuid
    whereConditions.push(
      `${this.columnParentUuid} IN (
        SELECT ${lastAlias}.uuid
        FROM ${this.nameQualified} ${firstAlias} ${joins.join(' ')}
        WHERE ${firstAlias}.parent_uuid = ${parentUuidSql}
      )`
    )
  }

  _addUuidEqualCondition(this.columnUuid, uuid)
  _addUuidEqualCondition(this.columnRecordUuid, recordUuid)
  _addUuidEqualCondition(this.columnNodeDefUuid, nodeDefUuid)
  _addParentNodeCondition()

  const _getColumnValueProp = (keyProp) => `${this.columnValue}->>'${keyProp}'`
  const columnTaxonUuid = _getColumnValueProp(Node.valuePropsTaxon.taxonUuid)
  const columnCategoryItemUuid = _getColumnValueProp(Node.valuePropsCode.itemUuid)
  const columnTaxonVernacularNameUuid = _getColumnValueProp(Node.valuePropsTaxon.vernacularNameUuid)

  const query = `SELECT ${this.columns},
        CASE
            WHEN ${columnTaxonUuid} IS NOT NULL
            THEN json_build_object( 
                'taxon',
                ${jsonBuildObject(
                  `'id'`,
                  tableTaxon.columnId,
                  `'uuid'`,
                  tableTaxon.columnUuid,
                  `'taxonomy_uuid'`,
                  tableTaxon.columnTaxonomyUuid,
                  `'props'`,
                  propsTaxon,
                  `'vernacular_name_uuid'`,
                  tableTaxonVernacularName.columnUuid,
                  `'vernacular_language'`,
                  `(${propsVernacularName})->>'lang'`,
                  `'vernacular_name'`,
                  `(${propsVernacularName})->>'name'`
                )} 
            )
            WHEN ${columnCategoryItemUuid} IS NOT NULL
            THEN json_build_object(
                'category_item',
                ${jsonBuildObject(
                  `'id'`,
                  tableCategoryItem.columnId,
                  `'uuid'`,
                  tableCategoryItem.columnUuid,
                  `'level_uuid'`,
                  tableCategoryItem.columnLevelUuid,
                  `'parent_uuid'`,
                  tableCategoryItem.columnParentUuid,
                  `'props'`,
                  propsCategoryItem
                )} 
            )
            ELSE NULL
        END AS ref_data
    FROM
        ${this.nameAliased}
    LEFT OUTER JOIN
        ${tableCategoryItem.nameAliased}
    ON
        (${columnCategoryItemUuid})::uuid = ${tableCategoryItem.columnUuid}
    LEFT OUTER JOIN
        ${tableTaxon.nameAliased}
    ON
        (${columnTaxonUuid})::uuid = ${tableTaxon.columnUuid}
    LEFT OUTER JOIN
        ${tableTaxonVernacularName.nameAliased}
    ON
        (${columnTaxonVernacularNameUuid})::uuid = ${tableTaxonVernacularName.columnUuid}
  `

  if (whereConditions.length > 0) {
    return `${query} WHERE ${whereConditions.join(' AND ')}`
  }
  return query
}
