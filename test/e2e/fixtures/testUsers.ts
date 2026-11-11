import { DB } from '@openforis/arena-server'

import * as User from '@core/user/user'
import * as WhatsNew from '@core/whatsNew/whatsNew'

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

const insertTestUser = async ({ tx, user }: { tx: any; user: TestUser }): Promise<void> => {
  const { name, email } = user
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
}

/**
 * Inserts the specified user as system administrator, if it does not exist yet,
 * and marks all the "What's new" items as seen, so the dialog does not cover the pages under test.
 * @param {TestUser} user - The user to insert.
 * @returns {Promise<void>} - Resolves when the user exists in the DB.
 */
export const insertTestUserIfMissing = (user: TestUser): Promise<void> =>
  DB.tx(async (tx) => {
    const { email } = user
    const userDb = await tx.oneOrNone(`SELECT uuid FROM "user" WHERE email = $1`, [email])
    if (!userDb) {
      await insertTestUser({ tx, user })
    }
    // done for existing users too: items may have been added to the catalog since they were created
    const whatsNewSeenIds = WhatsNew.whatsNewItems.map((item) => item.id)
    await tx.none(`UPDATE "user" SET prefs = COALESCE(prefs, '{}'::jsonb) || $2::jsonb WHERE email = $1`, [
      email,
      { [User.keysPrefs.whatsNewSeenIds]: whatsNewSeenIds },
    ])
  })
