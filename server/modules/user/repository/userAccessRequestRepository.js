import { db } from '@server/db/db'
import * as camelize from 'camelize'

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

export const insertUserAccessRequest = ({ userAccessRequest }, client = db) =>
  client.one(
    `
    INSERT INTO user_access_request AS u (email, props)
    VALUES ($1, $2::jsonb)
    RETURNING *`,
    [userAccessRequest.email, userAccessRequest.props],
    camelize
  )
