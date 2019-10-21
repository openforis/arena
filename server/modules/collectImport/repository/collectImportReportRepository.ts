import * as R from 'ramda';
import db from '../../../db/db';
import DbUtils from '../../../db/dbUtils';
import { getSurveyDBSchema, dbTransformCallback } from '../../survey/repository/surveySchemaRepositoryUtils';

const fetchItems = async (surveyId, client: any = db) =>
  await client.map(`
      SELECT *
      FROM ${getSurveyDBSchema(surveyId)}.collect_import_report
      ORDER BY id
    `,
    [],
    // @ts-ignore TODO
    dbTransformCallback
  )

const countItems = async (surveyId, client: any = db) =>
  await client.one(`
      SELECT COUNT(*) as tot
      FROM ${getSurveyDBSchema(surveyId)}.collect_import_report
    `,
    [],
    R.prop('tot')
  )

const insertItem = async (surveyId, nodeDefUuid, props, client: any = db) =>
  await client.one(`
      INSERT INTO ${getSurveyDBSchema(surveyId)}.collect_import_report (node_def_uuid, props)
      VALUES ($1, $2)
      RETURNING *
    `,
    [nodeDefUuid, props],
    dbTransformCallback
  )

const updateItem = async (surveyId, itemId, props, resolved, client: any = db) =>
  await client.one(`
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

export default {
  // CREATE
  insertItem,

  // READ
  fetchItems,
  countItems,

  // UPDATE
  updateItem
};
