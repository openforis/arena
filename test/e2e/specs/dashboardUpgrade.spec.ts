import { DB } from '@openforis/arena-server'

import { TestId } from '@webapp/utils/testId'

import { TEST_USER_PASSWORD_ENCRYPTED } from '../config'
import { expect, test } from '../fixtures'
import { sampleRecords } from '../fixtures/seed/sampleSurveyModel'
import { Urls } from '../helpers/urls'
import { saveAreaScreenshot, savingWhatsNewScreenshots } from '../helpers/whatsNewScreenshots'

test.describe('Dashboard (upgraded)', () => {
  test.use({ sampleSurveyOptions: { records: sampleRecords } })

  test('shows the KPI cards and the period selector without the legacy tabs', async ({ page, sampleSurvey: _ }) => {
    await page.goto(Urls.dashboard)

    await expect(page.getByTestId(TestId.dashboard.kpiRecords)).toBeVisible()
    await expect(page.getByTestId(TestId.dashboard.kpiContributors)).toBeVisible()
    await expect(page.getByTestId(TestId.dashboard.periodSelector)).toBeVisible()
    await expect(page.getByTestId(TestId.dashboard.trendSection)).toBeVisible()

    await expect(page.getByRole('tab', { name: /records by user/i })).toHaveCount(0)
  })

  // the sample survey has no geo attribute: the map section must not be rendered
  test('does not render the map section for a survey without geo attributes', async ({ page, sampleSurvey: _ }) => {
    await page.goto(Urls.dashboard)

    await expect(page.getByTestId(TestId.dashboard.kpiRecords)).toBeVisible()
    await expect(page.getByTestId(TestId.dashboard.mapSection)).toHaveCount(0)
  })

  test('fetches the activity log only when its section is expanded', async ({ page, sampleSurvey: _ }) => {
    const activityLogRequests: string[] = []
    page.on('request', (request) => {
      if (/\/activity-log(\?|$)/.test(request.url())) activityLogRequests.push(request.url())
    })
    await page.goto(Urls.dashboard)

    const toggle = page.getByTestId(TestId.dashboard.activityToggle)
    await toggle.scrollIntoViewIfNeeded()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(page.locator('.recent-activity')).toHaveCount(0)
    expect(activityLogRequests).toHaveLength(0)

    const responsePromise = page.waitForResponse((response) => /\/activity-log(\?|$)/.test(response.url()))
    await toggle.click()
    await responsePromise
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('.recent-activity')).toBeVisible()
  })
})

const describeWhatsNewScreenshots = savingWhatsNewScreenshots ? test.describe : () => undefined

describeWhatsNewScreenshots("What's new screenshots", () => {
  test.use({ sampleSurveyOptions: { records: sampleRecords } })

  // a field campaign: more records as the season goes on, a team of contributors, photos taking some storage
  const RECORDS_BY_MONTH = [6, 8, 11, 14, 18, 22, 25, 27, 30, 28, 24, 20]
  const CONTRIBUTORS = [
    { name: 'Amara Diallo', weight: 5 },
    { name: 'Lucía Fernández', weight: 4 },
    { name: 'Kenji Watanabe', weight: 3 },
    { name: 'Sofia Rossi', weight: 3 },
    { name: 'Jonas Berg', weight: 2 },
  ]
  // records are synced in batches: a few field days per month
  const FIELD_DAYS_PER_MONTH = 3
  const PHOTOS = 310
  const PHOTO_SIZE_MIN = 6_000_000
  const PHOTO_SIZE_RANGE = 12_000_000

  // deterministic pseudo-random numbers in [0, 1)
  const random = (seed: number): (() => number) => {
    let state = seed
    return () => {
      state = (state * 16807) % 2147483647
      return state / 2147483647
    }
  }

  const insertContributors = async (suffix: string): Promise<string[]> => {
    const uuids: string[] = []
    for (const [idx, { name }] of CONTRIBUTORS.entries()) {
      const row = await DB.one(
        `INSERT INTO "user" (name, email, password, status) VALUES ($1, $2, $3, 'ACCEPTED') RETURNING uuid`,
        [name, `e2e-dashboard-${idx}-${suffix}@openforis-arena.org`, TEST_USER_PASSWORD_ENCRYPTED]
      )
      uuids.push(row.uuid)
    }
    return uuids
  }

  // records spread over the last 12 months (the default period of the dashboard), by owner weight
  const insertRecords = async ({
    schema,
    ownerUuids,
    weights,
  }: {
    schema: string
    ownerUuids: string[]
    weights: number[]
  }) => {
    const rnd = random(42)
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    const pickOwner = (): string => {
      let r = rnd() * totalWeight
      const idx = weights.findIndex((w) => (r -= w) < 0)
      return ownerUuids[Math.max(0, idx)]
    }
    const now = Date.now()
    const day = 24 * 60 * 60 * 1000
    const rows: { owner: string; date: string }[] = []
    for (const [monthIdx, count] of RECORDS_BY_MONTH.entries()) {
      const monthsAgo = RECORDS_BY_MONTH.length - 1 - monthIdx
      const fieldDays = Array.from({ length: FIELD_DAYS_PER_MONTH }, (_, d) =>
        Math.floor(monthsAgo * 30.4 + (d * 30) / FIELD_DAYS_PER_MONTH + rnd() * 6)
      )
      for (let i = 0; i < count; i++) {
        const daysAgo = fieldDays[i % FIELD_DAYS_PER_MONTH]
        rows.push({ owner: pickOwner(), date: new Date(now - daysAgo * day - rnd() * 8 * 3600 * 1000).toISOString() })
      }
    }
    // same step and cycle as the sample records
    await DB.none(
      `INSERT INTO ${schema}.record (owner_uuid, step, cycle, date_created, date_modified)
       SELECT r.owner::uuid, t.step, t.cycle, r.date::timestamp, r.date::timestamp
       FROM json_to_recordset($1::json) AS r(owner text, date text)
       CROSS JOIN (SELECT step, cycle FROM ${schema}.record LIMIT 1) t`,
      [JSON.stringify(rows)]
    )
  }

  const insertPhotos = async (schema: string) => {
    const rnd = random(7)
    const sizes = Array.from({ length: PHOTOS }, () => Math.round(PHOTO_SIZE_MIN + rnd() * PHOTO_SIZE_RANGE))
    await DB.none(
      `INSERT INTO ${schema}.file (props)
       SELECT jsonb_build_object('name', 'photo_' || f.i || '.jpg', 'size', f.size, 'recordUuid', r.uuid)
       FROM json_to_recordset($1::json) AS f(i int, size int)
       JOIN LATERAL (SELECT uuid FROM ${schema}.record ORDER BY uuid OFFSET f.i % 200 LIMIT 1) r ON TRUE`,
      [JSON.stringify(sizes.map((size, i) => ({ i, size })))]
    )
  }

  test('dashboard', async ({ page, sampleSurvey, testUser }) => {
    const schema = `survey_${sampleSurvey.id}`
    const ownerUuids = await insertContributors(Date.now().toString(36))
    try {
      const testUserRow = await DB.one(`SELECT uuid FROM "user" WHERE email = $1`, [testUser.email])
      await insertRecords({
        schema,
        ownerUuids: [...ownerUuids, testUserRow.uuid],
        weights: [...CONTRIBUTORS.map((c) => c.weight), 2],
      })
      await insertPhotos(schema)

      await page.goto(Urls.dashboard)
      const periodSelector = page.getByTestId(TestId.dashboard.periodSelector)
      const kpiRecords = page.getByTestId(TestId.dashboard.kpiRecords)
      const trendSection = page.getByTestId(TestId.dashboard.trendSection)
      const recordsCount = RECORDS_BY_MONTH.reduce((sum, c) => sum + c, sampleRecords.length)
      await expect(kpiRecords).toContainText(String(recordsCount))
      await expect(page.getByTestId(TestId.dashboard.kpiContributors)).toContainText('6')
      await expect(page.getByTestId(TestId.dashboard.kpiStorage)).toContainText('%')
      await expect(trendSection.locator('svg path').first()).toBeVisible()
      // chart and cards animations
      await page.evaluate(() => Promise.allSettled(document.getAnimations().map((animation) => animation.finished)))
      await saveAreaScreenshot({ page, locators: [periodSelector, kpiRecords, trendSection], name: 'dashboardUpgrade' })
    } finally {
      await DB.none(`DELETE FROM ${schema}.file`)
      await DB.none(`DELETE FROM ${schema}.record WHERE owner_uuid IN ($1:csv)`, [ownerUuids])
      await DB.none(`DELETE FROM "user" WHERE uuid IN ($1:csv)`, [ownerUuids])
    }
  })
})
