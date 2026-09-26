import { test as base, expect } from '@playwright/test'

import { ArenaApi } from './arenaApi'
import { insertSampleSurvey, SampleSurveyOptions } from './seed/sampleSurvey'
import { getWorkerTestUser, insertTestUserIfMissing, TestUser } from './testUsers'

export type TestSurvey = {
  id: number
  name: string
  label: string
}

type WorkerFixtures = {
  testUser: TestUser
}

type TestFixtures = {
  /**
   * When true (default), the browser context is logged in as the worker test user before the test starts.
   */
  authenticated: boolean
  api: ArenaApi
  /**
   * A new, empty survey, created before the test and set as current survey of the test user.
   * It is deleted at the end of the test.
   */
  survey: TestSurvey
  /**
   * Options used to create the sample survey (see sampleSurvey fixture); override them with test.use(...).
   */
  sampleSurveyOptions: Omit<SampleSurveyOptions, 'userEmail' | 'name' | 'label'>
  /**
   * The sample survey (cluster -> plot -> tree, with a category and a taxonomy), inserted directly in the DB
   * before the test and set as current survey of the test user. It is deleted at the end of the test.
   */
  sampleSurvey: TestSurvey
}

// set E2E_KEEP_DATA=true to keep the surveys created by the tests (e.g. to inspect them after a failure)
const keepData = process.env.E2E_KEEP_DATA === 'true'

let surveyNameSeq = 0

/**
 * Generates a survey name unique across workers and test runs (it must match /^[a-z][a-z0-9_]{0,39}$/).
 * @param {number} parallelIndex - Index of the Playwright worker.
 * @returns {string} - The generated survey name.
 */
export const generateSurveyName = (parallelIndex: number): string => {
  surveyNameSeq += 1
  return `e2e_w${parallelIndex}_${Date.now().toString(36)}_${surveyNameSeq}`
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  testUser: [
    async ({}, use, workerInfo) => {
      const user = getWorkerTestUser(workerInfo.parallelIndex)
      await insertTestUserIfMissing(user)
      await use(user)
    },
    { scope: 'worker' },
  ],

  authenticated: [true, { option: true }],

  context: async ({ context, authenticated, testUser, baseURL }, use) => {
    // do not send analytics from the tests
    await context.route(/google-analytics\.com|googletagmanager\.com/, (route) => route.abort())
    if (authenticated) {
      // context.request shares the cookie jar with the browser context:
      // the refresh token cookie set by the login is then used by the web app to get its auth token
      const response = await context.request.post(`${baseURL}/auth/login`, {
        data: { email: testUser.email, password: testUser.password },
      })
      expect(response.ok(), `login of ${testUser.email} failed`).toBeTruthy()
    }
    await use(context)
  },

  api: async ({ baseURL, testUser }, use) => {
    const api = await ArenaApi.login({ baseURL: baseURL!, user: testUser })
    await use(api)
    await api.dispose()
  },

  survey: async ({ api }, use, testInfo) => {
    const name = generateSurveyName(testInfo.parallelIndex)
    const label = `Survey ${name}`
    const id = await api.createSurvey({ name, label })
    await use({ id, name, label })
    if (!keepData) await api.deleteSurveyIfExists(id)
  },

  sampleSurveyOptions: [{}, { option: true }],

  sampleSurvey: async ({ api, testUser, sampleSurveyOptions }, use, testInfo) => {
    const name = generateSurveyName(testInfo.parallelIndex)
    const label = `Sample survey ${name}`
    const id = await insertSampleSurvey({ ...sampleSurveyOptions, userEmail: testUser.email, name, label })
    await use({ id, name, label })
    if (!keepData) await api.deleteSurveyIfExists(id)
  },
})

export { expect }
