import camelize from 'camelize'

import db from '@server/db/db'

import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

// ====== CREATE

// ====== READ
export const fetchStepsByChainUuid = async (surveyId, processingChainUuid, client = db) => {
  const schema = getSurveyDBSchema(surveyId)

  return await client.map(`
    SELECT
      s.*,
      COUNT(c.uuid) AS calculations_count
    FROM
      ${schema}.processing_step s
    LEFT OUTER JOIN
      ${schema}.processing_step_calculation c
    ON
      s.uuid = c.processing_step_uuid
    WHERE
      s.processing_chain_uuid = $1
    GROUP BY
      s.uuid
    ORDER BY
      s.index`,
    [processingChainUuid],
    camelize
  )
}
// ====== UPDATE

// ====== DELETE
