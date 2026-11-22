import * as A from '@core/arena'

import { db, DbClient } from '@server/db/db'

// Reset password expires in 7 days (168 hours)
const expiredCondition = `date_created < (NOW() - INTERVAL '7 days')`

export const insertOrUpdateResetPassword = async (userUuid: string, client: DbClient = db) =>
  await client.one(
    `INSERT INTO user_reset_password (user_uuid)
      VALUES ($1)
      ON CONFLICT (user_uuid) DO UPDATE SET date_created = NOW(), uuid = DEFAULT
      RETURNING uuid`,
    [userUuid],
    A.prop('uuid')
  )

export const findResetPasswordUserUuidByUuid = async (uuid: string, client: DbClient = db) =>
  await client.oneOrNone(
    `SELECT user_uuid
     FROM user_reset_password
     WHERE uuid = $1 AND NOT ${expiredCondition}`,
    [uuid],
    A.prop('user_uuid')
  )

export const fetchResetPasswordUuidByUserUuid = async (userUuid: string, client: DbClient = db) =>
  await client.oneOrNone(
    `SELECT uuid
     FROM user_reset_password
     WHERE user_uuid = $1 AND NOT ${expiredCondition}`,
    [userUuid],
    A.prop('uuid')
  )

export const existsResetPasswordValidByUserUuid = async (userUuid: string, client: DbClient = db) =>
  await client.one(
    `SELECT COUNT(*) > 0 as result
    FROM user_reset_password
    WHERE user_uuid = $1 AND NOT ${expiredCondition}`,
    [userUuid],
    A.prop('result')
  )

export const existResetPasswordValidByUserUuids = (userUuids: string[], client: DbClient = db) => {
  return client.query(
    `SELECT user_uuid, COUNT(*) > 0 as result
    FROM user_reset_password
    WHERE user_uuid IN ($1:csv) AND NOT ${expiredCondition}
    group by user_uuid`,
    [userUuids]
  )
}

export const deleteUserResetPasswordByUuid = async (uuid: string, client: DbClient = db) =>
  await client.none(`DELETE FROM user_reset_password WHERE uuid = $1`, [uuid])

export const deleteUserResetPasswordExpired = async (client: DbClient = db) =>
  await client.result(
    `DELETE FROM user_reset_password
    WHERE ${expiredCondition}`,
    [],
    A.prop('rowCount')
  )
