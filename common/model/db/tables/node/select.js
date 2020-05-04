import * as Node from '../../../../../core/record/node'
import * as Schemata from '../../schemata'

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

  const _getPropsCombined = (table) => (draft ? `${table}.props || ${table}.props_draft` : `${table}.props`)

  const propsTaxon = _getPropsCombined('t')
  const propsVernacularName = _getPropsCombined('v')
  const propsCategoryItem = _getPropsCombined('c')

  const schemaSurvey = Schemata.getSchemaSurvey(this.surveyId)

  const whereConditions = []
  const _addUuidEqualCondition = (column, value) => {
    if (value) {
      const isUuid =
        value.length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
      whereConditions.push(`${column} = ${isUuid ? `'${value}'` : value}`)
    }
  }

  _addUuidEqualCondition(this.columnUuid, uuid)
  _addUuidEqualCondition(this.columnRecordUuid, recordUuid)
  _addUuidEqualCondition(this.columnParentUuid, parentUuid)
  _addUuidEqualCondition(this.columnNodeDefUuid, nodeDefUuid)

  const columnTaxonUuid = `${this.columnValue}->>'${Node.valuePropKeys.taxonUuid}'`
  const columnCategoryItemUuid = `${this.columnValue}->>'${Node.valuePropKeys.itemUuid}'`

  const query = `SELECT ${this.columns},
        CASE
            WHEN ${columnTaxonUuid} IS NOT NULL
            THEN json_build_object( 
                'taxon',
                json_build_object('id',t.id, 'uuid',t.uuid, 'taxonomy_uuid',t.taxonomy_uuid, 'props',${propsTaxon}, 'vernacular_name_uuid',v.uuid, 'vernacular_language',(${propsVernacularName})->>'lang', 'vernacular_name',(${propsVernacularName})->>'name') 
            )
            WHEN ${columnCategoryItemUuid} IS NOT NULL
            THEN json_build_object(
                'category_item',
                json_build_object('id',c.id, 'uuid',c.uuid, 'level_uuid',c.level_uuid, 'parent_uuid',c.parent_uuid, 'props',${propsCategoryItem}) 
            )
            ELSE NULL
        END AS ref_data
    FROM
        ${this.nameAliased}
    LEFT OUTER JOIN
        ${schemaSurvey}.category_item c
    ON
        (${columnCategoryItemUuid})::uuid = c.uuid
    LEFT OUTER JOIN
        ${schemaSurvey}.taxon t
    ON
        (${columnTaxonUuid})::uuid = t.uuid
    LEFT OUTER JOIN
        ${schemaSurvey}.taxon_vernacular_name v
    ON
        (${this.columnValue}->>'${Node.valuePropKeys.vernacularNameUuid}')::uuid = v.uuid`

  return `${query} WHERE ${whereConditions.join(' AND ')}`
}
