import type { Browser, BrowserContext } from '@playwright/test'

import { DB } from '@openforis/arena-server'

import * as Record from '@core/record/record'
import * as User from '@core/user/user'
import * as WhatsNew from '@core/whatsNew/whatsNew'
import { TestId } from '@webapp/utils/testId'
import { BASE_URL, TEST_USER_PASSWORD, TEST_USER_PASSWORD_ENCRYPTED } from '../config'
import { expect, test, TestSurvey } from '../fixtures'
import { Urls } from '../helpers/urls'

const draftLabel = 'Cluster id (draft)'
const whatsNewSeenIds = WhatsNew.whatsNewItems.map((item) => item.id)

// data editor of the survey (not a survey admin): it cannot open the form designer
const insertDataEditor = async ({ survey, email }: { survey: TestSurvey; email: string }): Promise<string> =>
  DB.tx(async (tx) => {
    const userUuid = await tx.one(
      `INSERT INTO "user" (name, email, password, status, prefs) VALUES ($1, $2, $3, 'ACCEPTED', $4::jsonb)
      RETURNING uuid`,
      // survey set as current survey; the "What's new" dialog must not cover the page
      [
        email,
        email,
        TEST_USER_PASSWORD_ENCRYPTED,
        {
          ...User.newPrefs({ surveyId: survey.id, surveyCycleKey: '0' }),
          [User.keysPrefs.whatsNewSeenIds]: whatsNewSeenIds,
        },
      ],
      (row: any) => row.uuid
    )
    await tx.none(
      `INSERT INTO auth_group_user (user_uuid, group_uuid)
      SELECT $1, g.uuid FROM auth_group g JOIN survey s ON s.uuid = g.survey_uuid
      WHERE s.id = $2 AND g.name = 'dataEditor'`,
      [userUuid, survey.id]
    )
    return userUuid
  })

const setFormPreviewForDataEntryUsers = (survey: TestSurvey, enabled: boolean) =>
  DB.none(`UPDATE survey SET props = props || $2::jsonb WHERE id = $1`, [
    survey.id,
    { formPreviewForDataEntryUsers: enabled },
  ])

// a change made in the form designer but not published yet
const setDraftClusterIdLabel = (survey: TestSurvey) =>
  DB.none(
    `UPDATE survey_${survey.id}.node_def
    SET props_draft = props_draft || $1::jsonb
    WHERE props ->> 'name' = 'cluster_id'`,
    [{ labels: { en: draftLabel } }]
  )

const newDataEditorContext = async ({ browser, email }: { browser: Browser; email: string }) => {
  const context = await browser.newContext({ baseURL: BASE_URL })
  await context.route(/google-analytics\.com|googletagmanager\.com/, (route) => route.abort())
  const loginResponse = await context.request.post('/auth/login', { data: { email, password: TEST_USER_PASSWORD } })
  expect(loginResponse.ok()).toBeTruthy()
  const { authToken } = await loginResponse.json()
  return { context, authToken }
}

const postRecordPreview = ({
  context,
  authToken,
  surveyId,
  userUuid,
}: {
  context: BrowserContext
  authToken: string
  surveyId: number
  userUuid: string
}) =>
  context.request.post(`/api/survey/${surveyId}/record`, {
    data: Record.newRecord({ uuid: userUuid } as any, '0', true),
    headers: { Authorization: `Bearer ${authToken}` },
  })

const openRecordsList = async (context: BrowserContext) => {
  const page = await context.newPage()
  await page.goto(Urls.records)
  return page
}

test.describe('Form preview for data entry users', () => {
  let email: string
  let userUuid: string
  let context: BrowserContext
  let authToken: string
  let surveyId: number

  test.beforeEach(async ({ browser, sampleSurvey }, testInfo) => {
    email = `e2e-data-editor-${testInfo.parallelIndex}-${Date.now()}@openforis-arena.org`
    surveyId = sampleSurvey.id
    userUuid = await insertDataEditor({ survey: sampleSurvey, email })
    await setDraftClusterIdLabel(sampleSurvey)
    ;({ context, authToken } = await newDataEditorContext({ browser, email }))
  })

  test.afterEach(async () => {
    await context.close()
    // preview records created by the user
    await DB.none(`DELETE FROM survey_${surveyId}.record WHERE owner_uuid = $1`, [userUuid])
    await DB.none(`DELETE FROM "user" WHERE email = $1`, [email])
  })

  test('previews the draft form when enabled in the survey', async ({ sampleSurvey }) => {
    await setFormPreviewForDataEntryUsers(sampleSurvey, true)
    const page = await openRecordsList(context)

    expect((await postRecordPreview({ context, authToken, surveyId: sampleSurvey.id, userUuid })).ok()).toBeTruthy()

    await page.getByRole('button', { name: 'Preview form' }).click()

    await expect(page.getByTestId(TestId.surveyForm.previewCloseBtn)).toBeVisible()
    await expect(page.getByText(draftLabel)).toBeVisible()

    await page.getByTestId(TestId.surveyForm.previewCloseBtn).click()
    await expect(page).toHaveURL(new RegExp(`${Urls.records}$`))
    // the records list shows the published form again
    await expect(page.getByRole('button', { name: 'Preview form' })).toBeVisible()
  })

  test('preview is not available when not enabled in the survey', async ({ sampleSurvey }) => {
    const page = await openRecordsList(context)
    await expect(page.getByTestId(TestId.records.addBtn)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Preview form' })).toHaveCount(0)

    const response = await postRecordPreview({ context, authToken, surveyId: sampleSurvey.id, userUuid })
    expect(response.status()).toBe(403)
  })
})

test.describe('Form preview from the records list for survey editors', () => {
  test('is available even when not enabled for data entry users', async ({ page, sampleSurvey }) => {
    await setDraftClusterIdLabel(sampleSurvey)
    await page.goto(Urls.records)

    await page.getByRole('button', { name: 'Preview form' }).click()

    await expect(page.getByTestId(TestId.surveyForm.previewCloseBtn)).toBeVisible()
    await expect(page.getByText(draftLabel)).toBeVisible()

    await page.getByTestId(TestId.surveyForm.previewCloseBtn).click()
    await expect(page).toHaveURL(new RegExp(`${Urls.records}$`))
  })
})
