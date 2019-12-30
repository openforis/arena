import * as R from 'ramda'

import { db } from '@server/db/db'

export const insertOrUpdateResetPassword = async (userUuid, client = db) =>
  await client.one(
    `INSERT INTO user_reset_password (user_uuid)
    VALUES ($1)
    ON CONFLICT (user_uuid) DO UPDATE SET date_created = NOW() 
    RETURNING uuid`,
    [userUuid],
    R.prop('uuid'),
  )
