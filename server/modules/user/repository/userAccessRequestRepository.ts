import camelize from 'camelize'

import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

import * as UserAccessRequest from '@core/user/userAccessRequest'

export const countUserAccessRequests = (client: any = db): Promise<number> =>
  client.one(
    `
      SELECT COUNT (*) FROM user_access_request
    `,
    [],
    (row: { count: string }) => Number(row.count)
  )

const userAccessRequestsSelect = `
    SELECT 
      ar.*,
      CASE 
        WHEN u.uuid IS NULL THEN '${UserAccessRequest.status.CREATED}' 
        ELSE '${UserAccessRequest.status.ACCEPTED}' 
        END 
        AS status,
      acc.name AS accepted_by_name,
      acc.email AS accepted_by_email
    FROM user_access_request ar
    LEFT OUTER JOIN "user" u
      ON u.email = ar.email
    -- modified_by is set to the user who accepted the request
    LEFT OUTER JOIN "user" acc
      ON acc.uuid = ar.modified_by
    ORDER BY
      ar.date_created DESC`

export const fetchUserAccessRequests = (
  { offset = 0, limit = null }: { offset?: number; limit?: number | null } = {},
  client: any = db
): Promise<UserAccessRequest.UserAccessRequest[]> =>
  client.map(
    `${userAccessRequestsSelect}
    OFFSET $/offset/
    ${limit ? `LIMIT $/limit/` : ''}
  `,
    { offset, limit },
    camelize
  )

export const fetchUserAccessRequestsAsStream = async (
  { processor }: { processor: (dbStream: any) => any },
  client: any = db
) => DbUtils.fetchQueryAsStream({ query: DbUtils.formatQuery(userAccessRequestsSelect, []), client, processor })

export const fetchUserAccessRequestByEmail = (
  { email }: { email: string },
  client: any = db
): Promise<UserAccessRequest.UserAccessRequest | null> =>
  client.oneOrNone(
    `
    SELECT * 
    FROM user_access_request
    WHERE email = $1
  `,
    [email],
    camelize
  )

export const fetchUserAccessRequestByUuid = (
  { uuid }: { uuid: string },
  client: any = db
): Promise<UserAccessRequest.UserAccessRequest | null> =>
  client.oneOrNone(
    `
  SELECT * 
  FROM user_access_request
  WHERE uuid = $1
`,
    [uuid],
    camelize
  )

export const insertUserAccessRequest = (
  { userAccessRequest }: { userAccessRequest: Pick<UserAccessRequest.UserAccessRequest, 'email' | 'props'> },
  client: any = db
): Promise<UserAccessRequest.UserAccessRequest> =>
  client.one(
    `
    INSERT INTO user_access_request AS u (email, props)
    VALUES ($1, $2::jsonb)
    RETURNING *`,
    [userAccessRequest.email, userAccessRequest.props],
    camelize
  )

export const updateUserAccessRequestStatus = (
  { userUuid, email, status }: { userUuid: string; email: string; status: UserAccessRequest.UserAccessRequestStatus },
  client: any = db
) =>
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

export const deleteUserAccessRequestsByEmail = ({ emails }: { emails: string[] }, client: any = db): Promise<null> =>
  client.none(
    `DELETE FROM user_access_request 
    WHERE email IN ($1:csv)`,
    [emails]
  )

export const deleteExpiredUserAccessRequests = (client: any = db): Promise<null> =>
  client.none(
    `DELETE FROM user_access_request 
    WHERE status = '${UserAccessRequest.status.CREATED}' 
      AND date_created < NOW() - INTERVAL '1 MONTH'`
  )
