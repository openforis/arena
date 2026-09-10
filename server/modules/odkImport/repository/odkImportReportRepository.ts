import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'
import * as OdkImportReportItem from '@core/survey/odkImportReportItem'

import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

import { getSurveyDBSchema, dbTransformCallback } from '../../survey/repository/surveySchemaRepositoryUtils'

const _getSelectWhereCondition = ({ excludeResolved }: { excludeResolved: boolean }): string =>
  excludeResolved ? 'WHERE resolved = FALSE' : ''

export const fetchItems = async (
  {
    surveyId,
    excludeResolved = false,
    offset = 0,
    limit = null,
  }: { surveyId: number; excludeResolved?: boolean; offset?: number; limit?: number | null },
  client: any = db
) =>
  client.map(
    `
      SELECT *
      FROM ${getSurveyDBSchema(surveyId)}.odk_import_report
      ${_getSelectWhereCondition({ excludeResolved })}
      ORDER BY id
      LIMIT ${limit ? '$/limit/' : 'ALL'}
      OFFSET $/offset/
    `,
    { limit, offset },
    dbTransformCallback
  )

// ODK report items carry a single, fixed-language message (not per-language like Collect's, since
// they're derived from XForm paths/type names, not translated text) - no messageLangCode param needed.
export const fetchItemsStream = async ({ surveyId }: { surveyId: number }) => {
  const select = `
      SELECT
        ir.id,
        ir.node_def_uuid,
        (nd.props_draft || nd.props)->>'${NodeDef.propKeys.name}' as node_def_name,
        (ir.props)->>'${OdkImportReportItem.propKeys.itemType}' as type,
        (ir.props)->>'${OdkImportReportItem.propKeys.expression}' as expression,
        (ir.props)->>'${OdkImportReportItem.propKeys.message}' as message,
        ir.props as props,
        ir.resolved as resolved
      FROM ${getSurveyDBSchema(surveyId)}.odk_import_report ir
      JOIN ${getSurveyDBSchema(surveyId)}.node_def nd on nd.uuid = ir.node_def_uuid
      ORDER BY id
   `

  return new DbUtils.QueryStream(DbUtils.formatQuery(select, []))
}

export const countItems = async (
  { surveyId, excludeResolved }: { surveyId: number; excludeResolved: boolean },
  client: any = db
) =>
  client.one(
    `
      SELECT COUNT(*) as tot
      FROM ${getSurveyDBSchema(surveyId)}.odk_import_report
      ${_getSelectWhereCondition({ excludeResolved })}
    `,
    [],
    R.prop('tot')
  )

export const insertItem = async (surveyId: number, item: any, client: any = db) =>
  client.one(
    `
      INSERT INTO ${getSurveyDBSchema(surveyId)}.odk_import_report (node_def_uuid, props, resolved)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
    [
      OdkImportReportItem.getNodeDefUuid(item),
      OdkImportReportItem.getProps(item),
      OdkImportReportItem.isResolved(item),
    ],
    dbTransformCallback
  )

export const insertItems = async ({ surveyId, items = [] }: { surveyId: number; items?: any[] }, client: any = db) =>
  items.length > 0 &&
  client.none(
    DbUtils.insertAllQueryBatch(
      getSurveyDBSchema(surveyId),
      'odk_import_report',
      ['node_def_uuid', 'props', 'resolved'],
      items.map((item) => ({
        node_def_uuid: OdkImportReportItem.getNodeDefUuid(item),
        props: OdkImportReportItem.getProps(item),
        resolved: OdkImportReportItem.isResolved(item),
      }))
    )
  )

export const updateItem = async (surveyId: number, itemId: number, props: any, resolved: boolean, client: any = db) =>
  client.one(
    `
      UPDATE ${getSurveyDBSchema(surveyId)}.odk_import_report
      SET
        props = props || $2::jsonb,
        resolved = $3,
        date_modified = ${DbUtils.now}
      WHERE id = $1
      RETURNING *
    `,
    [itemId, props, resolved],
    dbTransformCallback
  )
