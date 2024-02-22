import * as camelize from 'camelize'

import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

import * as UserAccessRequest from '@core/user/userAccessRequest'

export const countUserAccessRequests = (client = db) =>
  client.one(
    `
      SELECT COUNT (*) FROM user_access_request
    `,
    [],
    (row) => Number(row.count)
  )

const userAccessRequestsSelect = `
    SELECT 
      ar.*,
      CASE 
        WHEN u.uuid IS NULL THEN '${UserAccessRequest.status.CREATED}' 
        ELSE '${UserAccessRequest.status.ACCEPTED}' 
        END 
        AS status
    FROM user_access_request ar
    LEFT OUTER JOIN "user" u
      ON u.email = ar.email
    ORDER BY 
      ar.date_created DESC`

export const fetchUserAccessRequests = ({ offset = 0, limit = null } = {}, client = db) =>
  client.map(
    `${userAccessRequestsSelect}
    OFFSET $/offset/
    ${limit ? `LIMIT $/limit/` : ''}
  `,
    { offset, limit },
    camelize
  )

export const fetchUserAccessRequestsAsStream = async ({ transformer }, client = db) => {
  const stream = new DbUtils.QueryStream(DbUtils.formatQuery(userAccessRequestsSelect, []))
  await client.stream(stream, (dbStream) => dbStream.pipe(transformer))
}

export const fetchUserAccessRequestByEmail = ({ email }, client = db) =>
  client.oneOrNone(
    `
    SELECT * 
    FROM user_access_request
    WHERE email = $1
  `,
    [email],
    camelize
  )

export const fetchUserAccessRequestByUuid = ({ uuid }, client = db) =>
  client.oneOrNone(
    `
  SELECT * 
  FROM user_access_request
  WHERE uuid = $1
`,
    [uuid],
    camelize
  )

export const insertUserAccessRequest = ({ userAccessRequest }, client = db) =>
  client.one(
    `
    INSERT INTO user_access_request AS u (email, props)
    VALUES ($1, $2::jsonb)
    RETURNING *`,
    [userAccessRequest.email, userAccessRequest.props],
    camelize
  )

export const updateUserAccessRequestStatus = ({ userUuid, email, status }, client = db) =>
  client.oneOrNone(
    `
    UPDATE user_access_request
    SET 
      status = $/status/, 
      date_modified = NOW(), 
      modified_by = $/userUuid/
    WHERE email = $/email/
  `,
    { email, status, userUuid }
  )

export const deleteUserAccessRequestsByEmail = ({ emails }, client = db) =>
  client.none(
    `DELETE FROM user_access_request 
    WHERE email IN ($1:csv)`,
    [emails]
  )

export const deleteExpiredUserAccessRequests = (client = db) =>
  client.none(
    `DELETE FROM user_access_request 
    WHERE status = '${UserAccessRequest.status.CREATED}' 
      AND date_created < NOW() - INTERVAL '1 MONTH'`
  )
