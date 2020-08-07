import * as R from 'ramda'

import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

import { getSurveyDBSchema, dbTransformCallback } from '../../survey/repository/surveySchemaRepositoryUtils'

export const fetchItems = async (surveyId, offset = 0, limit = null, client = db) =>
  client.map(
    `
      SELECT * 
      FROM ${getSurveyDBSchema(surveyId)}.collect_import_report
      ORDER BY id
       LIMIT ${limit || 'ALL'}
    OFFSET ${offset}
    `,
    [],
    dbTransformCallback
  )

export const fetchItemsStream = async (surveyId, client = db) => {
  const select = `
      SELECT * 
      FROM ${getSurveyDBSchema(surveyId)}.collect_import_report
      ORDER BY id
   `

  return new DbUtils.QueryStream(DbUtils.formatQuery(select, []))
}

export const countItems = async (surveyId, client = db) =>
  await client.one(
    `
      SELECT COUNT(*) as tot
      FROM ${getSurveyDBSchema(surveyId)}.collect_import_report
    `,
    [],
    R.prop('tot')
  )

export const insertItem = async (surveyId, nodeDefUuid, props, client = db) =>
  await client.one(
    `
      INSERT INTO ${getSurveyDBSchema(surveyId)}.collect_import_report (node_def_uuid, props)
      VALUES ($1, $2)
      RETURNING *
    `,
    [nodeDefUuid, props],
    dbTransformCallback
  )

export const updateItem = async (surveyId, itemId, props, resolved, client = db) =>
  await client.one(
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
