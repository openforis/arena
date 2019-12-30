import { db } from '@server/db/db'

import * as camelize from 'camelize'

export const insertUserResetPassword = async (userUuid, client = db) =>
  await client.one(
    `INSERT INTO user_reset_password (user_uuid)
    VALUES ($1)
    RETURNING *`,
    [userUuid],
    camelize,
  )
