import * as A from '@core/arena'

import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

import { db } from '@server/db/db'

export const fetchNodesHierarchyKeys = async ({ surveyId, nodeIIds }, client = db) =>
  client.map(
    `
    SELECT *
    FROM 
      ${SchemaRdb.getName(surveyId)}._node_keys_hierarchy h
    WHERE 
      h.node_i_id IN ($1:csv)
    `,
    [nodeIIds],
    A.camelizePartial({ limitToLevel: 1 })
  )
