import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'
import * as CollectImportReportItem from '@core/survey/collectImportReportItem'

import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

import { getSurveyDBSchema, dbTransformCallback } from '../../survey/repository/surveySchemaRepositoryUtils'

export const fetchItems = async (surveyId, offset = 0, limit = null, client = db) =>
  client.map(
    `
      SELECT * 
      FROM ${getSurveyDBSchema(surveyId)}.collect_import_report
      ORDER BY id
      LIMIT ${limit ? '$/limit/' : 'ALL'}
      OFFSET $/offset/
    `,
    { limit, offset },
    dbTransformCallback
  )

export const fetchItemsStream = async (surveyId) => {
  const select = `
      SELECT 
        cr.id,
        cr.node_def_uuid,
        (nd.props_draft || nd.props)->>'${NodeDef.propKeys.name}' as node_def_name,
        (cr.props)->>'${CollectImportReportItem.propKeys.expressionType}' as type,
        (cr.props)->>'${CollectImportReportItem.propKeys.expression}' as expression,
        (cr.props)->>'${CollectImportReportItem.propKeys.applyIf}' as apply_if,
        cr.props as props,
        cr.resolved as resolved
      FROM ${getSurveyDBSchema(surveyId)}.collect_import_report cr
      JOIN ${getSurveyDBSchema(surveyId)}.node_def nd on nd.uuid = cr.node_def_uuid
      ORDER BY id
   `

  return new DbUtils.QueryStream(DbUtils.formatQuery(select, []))
}

export const countItems = async (surveyId, client = db) =>
  client.one(
    `
      SELECT COUNT(*) as tot
      FROM ${getSurveyDBSchema(surveyId)}.collect_import_report
    `,
    [],
    R.prop('tot')
  )

export const insertItem = async (surveyId, nodeDefUuid, props, client = db) =>
  client.one(
    `
      INSERT INTO ${getSurveyDBSchema(surveyId)}.collect_import_report (node_def_uuid, props)
      VALUES ($1, $2)
      RETURNING *
    `,
    [nodeDefUuid, props],
    dbTransformCallback
  )

export const updateItem = async (surveyId, itemId, props, resolved, client = db) =>
  client.one(
    `
      UPDATE ${getSurveyDBSchema(surveyId)}.collect_import_report
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
