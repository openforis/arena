import * as R from 'ramda'

import { db } from '@server/db/db'

// Reset password expires in 48 hours
const expiredCondition = `date_created < NOW() - INTERVAL '48 HOURS'`

export const insertOrUpdateResetPassword = async (userUuid, client = db) =>
  await client.one(
    `INSERT INTO user_reset_password (user_uuid)
    VALUES ($1)
    ON CONFLICT (user_uuid) DO UPDATE SET date_created = NOW() 
    RETURNING uuid`,
    [userUuid],
    R.prop('uuid'),
  )

/**
 * Finds a not-expired (date_created < now() - 48 hours) user reset password item by uuid
 */
export const findUserUuidByUuid = async (uuid, client = db) =>
  await client.oneOrNone(
    `SELECT user_uuid
     FROM user_reset_password
     WHERE uuid = $1 AND NOT ${expiredCondition}`,
    [uuid],
    R.prop('user_uuid'),
  )

export const deleteUserResetPasswordByUuid = async (uuid, client = db) =>
  await client.none(`DELETE FROM user_reset_password WHERE uuid = $1`, [uuid])

export const deleteUserResetPasswordExpired = async (client = db) =>
  await client.result(
    `DELETE FROM user_reset_password
    WHERE ${expiredCondition}`,
    [],
    R.prop('rowCount'),
  )
