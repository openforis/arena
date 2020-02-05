import camelize from 'camelize'

import { db } from '../db'

export const fetchMaterializedViewsBySchema = async (schema, client = db) =>
  await client.map(
    `
    SELECT
      schemaname   AS schema_name,
      matviewname  AS view_name,
      matviewowner AS owner,
      ispopulated  AS is_populated,
      definition
    FROM
      pg_matviews
    WHERE
      schemaname = $1
    ORDER BY
      view_name
    `,
    [schema],
    camelize,
  )
