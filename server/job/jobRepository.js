import { db } from '@server/db/db'

import { jobStatus } from './jobUtils'

const selectAllJobs = `
  SELECT
    j.uuid, j.type, j.status, j.processed, j.total, j.props,
    j.date_created, j.date_modified, j.user_uuid, j.survey_id,
    u.name AS user_name, u.email AS user_email,
    COALESCE(s.props->>'name', s.props_draft->>'name') AS survey_name
  FROM job j
  LEFT JOIN "user" u ON u.uuid = j.user_uuid
  LEFT JOIN survey s ON s.id = j.survey_id
  ORDER BY j.date_created DESC
  LIMIT $1
`

const rowToJob = (row) => ({
  uuid: row.uuid,
  type: row.type,
  status: row.status,
  processed: row.processed,
  total: row.total,
  props: row.props,
  dateCreated: row.date_created,
  dateModified: row.date_modified,
  userUuid: row.user_uuid,
  userName: row.user_name,
  userEmail: row.user_email,
  surveyId: row.survey_id,
  surveyName: row.survey_name,
})

export const getAll = ({ limit = 200 } = {}) => db.map(selectAllJobs, [limit], rowToJob)

// marks still active jobs as alive (see the stale jobs cleanup scheduler)
export const touchActiveJobs = async ({ uuids }, client = db) => {
  if (uuids.length === 0) return
  await client.none(
    `UPDATE job
     SET date_modified = (now() AT TIME ZONE 'UTC')
     WHERE uuid IN ($1:csv) AND status IN ($2, $3)`,
    [uuids, jobStatus.pending, jobStatus.running]
  )
}
