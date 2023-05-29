import { isUuid } from '../../../../../core/uuid'
import * as Survey from '../../../../../core/survey/survey'
import * as NodeDef from '../../../../../core/survey/nodeDef'
import * as Node from '../../../../../core/record/node'

import TableCategoryItem from '../categoryItem'
import TableTaxon from '../taxon'
import TableTaxonVernacularName from '../taxonVernacularName'
import { jsonBuildObject } from '../../sql'

const _isInsideSingleEntity = ({ survey, nodeDefUuid }) => {
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
  return NodeDef.isSingle(nodeDefParent)
}

/**
 * Generates the select query for the node table by the given parameters.
 *
 * @param {!object} params - The query parameters.
 * @param {string} [params.uuid=null] - The node uuid to filter by.
 * @param {string} [params.recordUuid=null] - The record uuid to filter by.
 * @param {string} [params.parentUuid=null] - The parent node uuid to filter by.
 * @param {string} [params.nodeDefUuid=null] - The node definition uuid to filter by.
 * @param {boolean} [params.draft=false] - Whether to fetch draft props or only published ones.
 * @returns {string} - The select query.
 */
export function getSelect(params) {
  const { uuid = null, recordUuid = null, parentUuid = null, nodeDefUuid = null, draft = false } = params

  const _getPropsCombined = (table) =>
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
      whereConditions.push(`${column} = ${isUuid(value) ? `'${value}'` : value}`)
    }
  }

  const _addParentNodeCondition = () => {
    if (nodeDefUuid && _isInsideSingleEntity({ survey: this.survey, nodeDefUuid })) {
      // node def is inside a single entity
      // parentUuid is the uuid of the first ancestor multiple entity
      // use node hierarchy in the where condition
      whereConditions.push(
        `${parentUuid}::text IN (SELECT jsonb_array_elements_text(${this.columnMeta} -> '${Node.metaKeys.hierarchy}'))`
      )
    } else {
      _addUuidEqualCondition(this.columnParentUuid, parentUuid)
    }
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
