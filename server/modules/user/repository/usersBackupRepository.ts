import camelize from 'camelize'

import { db } from '@server/db/db'

// Data access for the users backup export/import: surveys are referenced by name, since their uuids differ between servers.

// survey name is in props_draft only for surveys never published
const surveyNameField = `COALESCE(s.props ->> 'name', s.props_draft ->> 'name')`

export type UserBackupRow = {
  uuid: string
  email: string
  name: string | null
  status: string
  props: Record<string, any>
  password: string | null
  hasProfilePicture: boolean
}

export type AuthGroupMembershipRow = {
  userUuid: string
  groupName: string
  surveyName: string | null
  props: Record<string, any> | null
}

export type UserGroupMembershipRow = {
  userUuid: string
  groupName: string
  surveyName: string
}

export type AuthGroupRow = {
  uuid: string
  name: string
  surveyUuid: string | null
  surveyName: string | null
}

export type UserGroupRow = {
  uuid: string
  name: string
  surveyName: string
}

// READ

export const fetchUsersForBackup = (
  { includePasswords }: { includePasswords: boolean },
  client: any = db
): Promise<UserBackupRow[]> =>
  client.map(
    `
    SELECT u.uuid, u.email, u.name, u.status, u.props,
      ${includePasswords ? 'u.password' : 'NULL AS password'},
      u.profile_picture IS NOT NULL AS has_profile_picture
    FROM "user" u
    ORDER BY u.email`,
    [],
    camelize
  )

export const fetchAuthGroupMembershipsForBackup = (client: any = db): Promise<AuthGroupMembershipRow[]> =>
  client.map(
    `
    SELECT gu.user_uuid, g.name AS group_name, ${surveyNameField} AS survey_name, gu.props
    FROM auth_group_user gu
      JOIN auth_group g ON g.uuid = gu.group_uuid
      LEFT OUTER JOIN survey s ON s.uuid = g.survey_uuid`,
    [],
    (row: any) => ({ ...camelize(row), props: row.props })
  )

export const fetchUserGroupMembershipsForBackup = (client: any = db): Promise<UserGroupMembershipRow[]> =>
  client.map(
    `
    SELECT ugu.user_uuid, ug.props ->> 'name' AS group_name, ${surveyNameField} AS survey_name
    FROM user_group_user ugu
      JOIN user_group ug ON ug.uuid = ugu.group_uuid
      JOIN survey s ON s.uuid = ug.survey_uuid`,
    [],
    camelize
  )

export const fetchUserUuidByEmail = ({ email }: { email: string }, client: any = db): Promise<string | null> =>
  client.oneOrNone(`SELECT uuid FROM "user" WHERE email = $1`, [email], (row: any) => row?.uuid ?? null)

export const fetchUserUuidsByEmails = (
  { emails }: { emails: string[] },
  client: any = db
): Promise<{ email: string; uuid: string }[]> =>
  emails.length === 0
    ? Promise.resolve([])
    : client.map(`SELECT email, uuid FROM "user" WHERE email IN ($1:csv)`, [emails], camelize)

export const existsUserByUuid = ({ uuid }: { uuid: string }, client: any = db): Promise<boolean> =>
  client.one(`SELECT EXISTS (SELECT 1 FROM "user" WHERE uuid = $1)`, [uuid], (row: any) => row.exists)

export const fetchAuthGroups = (client: any = db): Promise<AuthGroupRow[]> =>
  client.map(
    `
    SELECT g.uuid, g.name, g.survey_uuid, ${surveyNameField} AS survey_name
    FROM auth_group g
      LEFT OUTER JOIN survey s ON s.uuid = g.survey_uuid`,
    [],
    camelize
  )

export const fetchUserGroups = (client: any = db): Promise<UserGroupRow[]> =>
  client.map(
    `
    SELECT ug.uuid, ug.props ->> 'name' AS name, ${surveyNameField} AS survey_name
    FROM user_group ug
      JOIN survey s ON s.uuid = ug.survey_uuid`,
    [],
    camelize
  )

export const fetchUserAuthGroupUuids = ({ userUuid }: { userUuid: string }, client: any = db): Promise<string[]> =>
  client.map(`SELECT group_uuid FROM auth_group_user WHERE user_uuid = $1`, [userUuid], (row: any) => row.group_uuid)

export const fetchUserUserGroupUuids = ({ userUuid }: { userUuid: string }, client: any = db): Promise<string[]> =>
  client.map(`SELECT group_uuid FROM user_group_user WHERE user_uuid = $1`, [userUuid], (row: any) => row.group_uuid)

// CREATE

export const insertUser = (
  {
    uuid,
    email,
    name,
    password,
    status,
    props,
    profilePicture,
  }: {
    uuid: string
    email: string
    name: string | null
    password: string | null
    status: string
    props: Record<string, any>
    profilePicture: Buffer | null
  },
  client: any = db
): Promise<void> =>
  client.none(
    `
    INSERT INTO "user" (uuid, email, name, password, status, props, profile_picture)
    VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
    [uuid, email, name, password, status, props, profilePicture]
  )

export const insertAuthGroupUser = (
  { userUuid, groupUuid, props }: { userUuid: string; groupUuid: string; props: Record<string, any> | null },
  client: any = db
): Promise<void> =>
  client.none(
    `
    INSERT INTO auth_group_user (user_uuid, group_uuid, props)
    VALUES ($1, $2, $3::jsonb)
    ON CONFLICT DO NOTHING`,
    [userUuid, groupUuid, props]
  )

export const insertUserGroupUser = (
  { userUuid, groupUuid }: { userUuid: string; groupUuid: string },
  client: any = db
): Promise<void> =>
  client.none(
    `
    INSERT INTO user_group_user (user_uuid, group_uuid)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING`,
    [userUuid, groupUuid]
  )

// UPDATE

// password and profile picture are kept when not specified
export const updateUser = (
  {
    uuid,
    name,
    password,
    status,
    props,
    profilePicture,
  }: {
    uuid: string
    name: string | null
    password: string | null
    status: string
    props: Record<string, any>
    profilePicture: Buffer | null
  },
  client: any = db
): Promise<void> =>
  client.none(
    `
    UPDATE "user"
    SET name = $2,
      status = $3,
      props = $4::jsonb,
      password = COALESCE($5, password),
      profile_picture = COALESCE($6, profile_picture)
    WHERE uuid = $1`,
    [uuid, name, status, props, password, profilePicture]
  )

// DELETE

export const deleteAuthGroupUsers = (
  { userUuid, groupUuids }: { userUuid: string; groupUuids: string[] },
  client: any = db
): Promise<void> =>
  client.none(`DELETE FROM auth_group_user WHERE user_uuid = $1 AND group_uuid IN ($2:csv)`, [userUuid, groupUuids])
