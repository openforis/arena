import { DB } from '@openforis/arena-server'

import * as User from '@core/user/user'
import * as WhatsNew from '@core/whatsNew/whatsNew'

import type { ServerOnlyPrefsKey } from '@server/modules/user/serverOnlyPrefs'

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
export const insertTestUserIfMissing = async (user: TestUser): Promise<void> =>
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
    // the profile requires a title: without it the profile Save button stays disabled
    await tx.none(`UPDATE "user" SET props = COALESCE(props, '{}'::jsonb) || $2::jsonb WHERE email = $1`, [
      email,
      { [User.keysProps.title]: User.titleKeys.preferNotToSay },
    ])
  })

// the prefs key of the AI settings and providers (typed against the server's list of server-only keys)
const aiPrefsKey: ServerOnlyPrefsKey = 'ai'

/**
 * Removes the AI settings and providers (`prefs.ai`) of the user, so a test does not inherit the AI access level,
 * toggles, providers or default provider that the previous test left on the shared worker user. The usage counters
 * (`prefs.aiUsage`) are kept.
 * @param {TestUser} user - The user.
 * @returns {Promise<void>} - Resolves when the prefs are reset.
 */
export const resetTestUserAiPrefs = async (user: TestUser): Promise<void> => {
  await DB.none(`UPDATE "user" SET prefs = COALESCE(prefs, '{}'::jsonb) - $2::text WHERE email = $1`, [
    user.email,
    aiPrefsKey,
  ])
}

/**
 * Returns the survey editor (not survey administrator) used by the worker with the specified parallel index.
 * @param {number} parallelIndex - Index of the Playwright worker.
 * @returns {TestUser} - The user.
 */
export const getWorkerSurveyEditor = (parallelIndex: number): TestUser => ({
  email: `e2e-editor-${parallelIndex}@openforis-arena.org`,
  name: `E2E Editor ${parallelIndex}`,
  password: TEST_USER_PASSWORD,
})

/**
 * Returns the data editor (no record cleanse permission) used by the worker with the specified parallel index.
 * @param {number} parallelIndex - Index of the Playwright worker.
 * @returns {TestUser} - The user.
 */
export const getWorkerDataEditor = (parallelIndex: number): TestUser => ({
  email: `e2e-data-editor-${parallelIndex}@openforis-arena.org`,
  name: `E2E Data Editor ${parallelIndex}`,
  password: TEST_USER_PASSWORD,
})

/**
 * Inserts the user if missing, adds it to the survey editor group of the survey and sets the survey as its
 * current survey (and marks the "What's new" items as seen).
 * @param {object} params - Parameters.
 * @param {TestUser} params.user - The user.
 * @param {number} params.surveyId - Survey id.
 * @param {string} [params.groupName] - Survey group name (default surveyEditor).
 * @returns {Promise<void>} - Resolves when done.
 */
export const insertSurveyEditor = async ({
  user,
  surveyId,
  groupName = 'surveyEditor',
}: {
  user: TestUser
  surveyId: number
  groupName?: string
}): Promise<void> =>
  DB.tx(async (tx) => {
    const { name, email } = user
    const userDb = await tx.oneOrNone(`SELECT uuid FROM "user" WHERE email = $1`, [email])
    if (!userDb) {
      await tx.none(`INSERT INTO "user" (name, email, password, status) VALUES ($1, $2, $3, 'ACCEPTED')`, [
        name,
        email,
        TEST_USER_PASSWORD_ENCRYPTED,
      ])
    }
    await tx.none(
      `INSERT INTO auth_group_user (user_uuid, group_uuid)
       SELECT u.uuid, g.uuid
       FROM "user" u
       JOIN survey s ON s.id = $2
       JOIN auth_group g ON g.survey_uuid = s.uuid AND g.name = $3
       WHERE u.email = $1`,
      [email, surveyId, groupName]
    )
    const whatsNewSeenIds = WhatsNew.whatsNewItems.map((item) => item.id)
    await tx.none(`UPDATE "user" SET prefs = COALESCE(prefs, '{}'::jsonb) || $2::jsonb WHERE email = $1`, [
      email,
      { [User.keysPrefs.whatsNewSeenIds]: whatsNewSeenIds, surveys: { current: surveyId } },
    ])
  })
