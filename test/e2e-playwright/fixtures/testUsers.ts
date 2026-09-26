import { DB } from '@openforis/arena-server'

import { TEST_USER_PASSWORD, TEST_USER_PASSWORD_ENCRYPTED } from '../config'

export type TestUser = {
  email: string
  name: string
  password: string
}

/**
 * Returns the test user used by the worker with the specified parallel index.
 * Every worker has its own user because the "current survey" is stored in the user prefs:
 * workers sharing the same user would change each other's current survey.
 * @param {number} parallelIndex - Index of the Playwright worker.
 * @returns {TestUser} - The test user.
 */
export const getWorkerTestUser = (parallelIndex: number): TestUser => ({
  email: `e2e-worker-${parallelIndex}@openforis-arena.org`,
  name: `E2E Tester ${parallelIndex}`,
  password: TEST_USER_PASSWORD,
})

/**
 * Inserts the specified user as system administrator, if it does not exist yet.
 * @param {TestUser} user - The user to insert.
 * @returns {Promise<void>} - Resolves when the user exists in the DB.
 */
export const insertTestUserIfMissing = async (user: TestUser): Promise<void> =>
  DB.tx(async (tx) => {
    const { name, email } = user
    const userDb = await tx.oneOrNone(`SELECT uuid FROM "user" WHERE email = $1`, [email])
    if (userDb) return

    await tx.none(`INSERT INTO "user" (name, email, password, status) VALUES ($1, $2, $3, 'ACCEPTED')`, [
      name,
      email,
      TEST_USER_PASSWORD_ENCRYPTED,
    ])
    await tx.none(
      `INSERT INTO auth_group_user (user_uuid, group_uuid)
       SELECT u.uuid, g.uuid
       FROM "user" u
       JOIN auth_group g ON g.name = 'systemAdmin'
       WHERE u.email = $1`,
      [email]
    )
  })
