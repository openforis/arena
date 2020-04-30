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
  if (uuid) {
    whereConditions.push(`${this.columnUuid} = '${uuid}'`)
  }
  if (recordUuid) {
    whereConditions.push(`${this.columnRecordUuid} = '${recordUuid}'`)
  }
  if (parentUuid) {
    whereConditions.push(`${this.columnParentUuid} = '${parentUuid}'`)
  }
  if (nodeDefUuid) {
    whereConditions.push(`${this.columnNodeDefUuid} = '${nodeDefUuid}'`)
  }

  const query = `SELECT ${this.columns},
        CASE
            WHEN ${this.columnValue}->>'${Node.valuePropKeys.taxonUuid}' IS NOT NULL
            THEN json_build_object( 
                'taxon',
                json_build_object('id',t.id, 'uuid',t.uuid, 'taxonomy_uuid',t.taxonomy_uuid, 'props',${propsTaxon}, 'vernacular_name_uuid',v.uuid, 'vernacular_language',(${propsVernacularName})->>'lang', 'vernacular_name',(${propsVernacularName})->>'name') 
            )
            WHEN ${this.columnValue}->>'${Node.valuePropKeys.itemUuid}' IS NOT NULL
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
        (${this.columnValue}->>'${Node.valuePropKeys.itemUuid}')::uuid = c.uuid
    LEFT OUTER JOIN
        ${schemaSurvey}.taxon t
    ON
        (${this.columnValue}->>'${Node.valuePropKeys.taxonUuid}')::uuid = t.uuid
    LEFT OUTER JOIN
        ${schemaSurvey}.taxon_vernacular_name v
    ON
        (${this.columnValue}->>'${Node.valuePropKeys.vernacularNameUuid}')::uuid = v.uuid`

  return `${query} WHERE ${whereConditions.join(' AND ')}`
}
