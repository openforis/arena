import { db } from '@server/db/db'
import * as JobRepository from '@server/job/jobRepository'
import { getContextUser } from '../config/context'

describe('jobRepository.getAll', () => {
  let userUuid
  let surveyId

  beforeAll(async () => {
    const user = getContextUser()
    userUuid = user.uuid

    const survey = await db.one(`INSERT INTO survey (owner_uuid, props) VALUES ($1, $2) RETURNING id`, [
      userUuid,
      JSON.stringify({ name: 'job_monitor_test_survey' }),
    ])
    surveyId = survey.id
  })

  afterAll(async () => {
    await db.none('DELETE FROM job WHERE survey_id = $1 OR user_uuid = $2', [surveyId, userUuid])
    await db.none('DELETE FROM survey WHERE id = $1', [surveyId])
  })

  test('joins user and survey info, and handles a global (null survey_id) job', async () => {
    await db.none(
      `INSERT INTO job (uuid, user_uuid, survey_id, type, status) VALUES ($1, $2, $3, 'SurveyJob', 'running')`,
      ['11111111-1111-1111-1111-111111111111', userUuid, surveyId]
    )
    await db.none(
      `INSERT INTO job (uuid, user_uuid, survey_id, type, status) VALUES ($1, $2, NULL, 'GlobalJob', 'pending')`,
      ['22222222-2222-2222-2222-222222222222', userUuid]
    )

    const rows = await JobRepository.getAll({ limit: 10 })
    const surveyJobRow = rows.find((row) => row.uuid === '11111111-1111-1111-1111-111111111111')
    const globalJobRow = rows.find((row) => row.uuid === '22222222-2222-2222-2222-222222222222')

    expect(surveyJobRow).toMatchObject({
      type: 'SurveyJob',
      status: 'running',
      userUuid,
      userEmail: 'admin@openforis.org',
      surveyId,
      surveyName: 'job_monitor_test_survey',
    })
    expect(globalJobRow).toMatchObject({
      type: 'GlobalJob',
      status: 'pending',
      surveyId: null,
      surveyName: null,
    })
  })

  test('orders by date_created descending and respects limit', async () => {
    // Insert jobs with explicit timestamps to verify descending order
    const now = new Date()
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000)
    const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000)

    // Insert older job first
    await db.none(
      `INSERT INTO job (uuid, user_uuid, survey_id, type, status, date_created) VALUES ($1, $2, $3, 'OldJob', 'pending', $4)`,
      ['33333333-3333-3333-3333-333333333333', userUuid, surveyId, twoMinutesAgo]
    )

    // Insert newer job second
    await db.none(
      `INSERT INTO job (uuid, user_uuid, survey_id, type, status, date_created) VALUES ($1, $2, $3, 'NewJob', 'pending', $4)`,
      ['44444444-4444-4444-4444-444444444444', userUuid, surveyId, oneMinuteAgo]
    )

    // Get all jobs (limit should return both our new jobs and previously inserted jobs)
    const rows = await JobRepository.getAll({ limit: 10 })
    expect(rows.length).toBeGreaterThanOrEqual(4) // At least the 4 jobs we've inserted

    // Verify that rows are ordered by date_created descending
    const newJobRow = rows.find((row) => row.uuid === '44444444-4444-4444-4444-444444444444')
    const oldJobRow = rows.find((row) => row.uuid === '33333333-3333-3333-3333-333333333333')

    expect(newJobRow).toBeDefined()
    expect(oldJobRow).toBeDefined()
    // Newer job should appear before older job in results (descending order)
    const newJobIndex = rows.findIndex((row) => row.uuid === '44444444-4444-4444-4444-444444444444')
    const oldJobIndex = rows.findIndex((row) => row.uuid === '33333333-3333-3333-3333-333333333333')
    expect(newJobIndex).toBeLessThan(oldJobIndex)

    // Verify all consecutive rows are in descending order
    for (let i = 0; i < rows.length - 1; i++) {
      const currentTimestamp = new Date(rows[i].dateCreated).getTime()
      const nextTimestamp = new Date(rows[i + 1].dateCreated).getTime()
      expect(currentTimestamp).toBeGreaterThanOrEqual(nextTimestamp)
    }

    // Also verify that limit is respected
    const limitedRows = await JobRepository.getAll({ limit: 1 })
    expect(limitedRows).toHaveLength(1)
  })
})
