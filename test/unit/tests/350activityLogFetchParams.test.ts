import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'

jest.mock('@server/db/db', () => ({ db: {} }))

const surveyInfo = { id: 7, uuid: '11111111-1111-4111-8111-111111111111', published: false }

/**
 * Runs the fetch against a database client double that records the statement and its parameters.
 * @param {object} params - The fetch params.
 * @returns {Promise<{sql: string, values: unknown[]}>} The statement and its parameters.
 */
const runFetch = async (params: Record<string, unknown>) => {
  const calls: { sql: string; values: unknown[] }[] = []
  const client = {
    map: async (sql: string, values: unknown[]) => {
      calls.push({ sql, values })
      return []
    },
  }
  await ActivityLogRepository.fetch({ surveyInfo, client: client as any, ...params })
  return calls[0]
}

describe('the activity log fetch binds the id bounds as parameters (350)', () => {
  test('idLessThan is a parameter, never part of the SQL text', async () => {
    const { sql, values } = await runFetch({ idLessThan: 987654321 })

    expect(sql).not.toContain('987654321')
    expect(sql).toMatch(/id < \$4/)
    expect(values[3]).toBe(987654321)
  })

  test('idGreaterThan is a parameter, never part of the SQL text', async () => {
    const { sql, values } = await runFetch({ idGreaterThan: 123456789 })

    expect(sql).not.toContain('123456789')
    expect(sql).toMatch(/id > \$4/)
    expect(values[3]).toBe(123456789)
  })

  test('a malicious value stays inside the parameter', async () => {
    const injection = '1; DROP TABLE activity_log; --'
    const { sql, values } = await runFetch({ idLessThan: injection })

    expect(sql).not.toContain('DROP TABLE')
    expect(values[3]).toBe(injection)
  })

  test('idGreaterThan wins when both bounds are given', async () => {
    const { sql, values } = await runFetch({ idGreaterThan: 10, idLessThan: 20 })

    expect(sql).toMatch(/id > \$4/)
    expect(sql).not.toMatch(/id < \$4/)
    expect(values[3]).toBe(10)
  })

  test('no id bound adds no condition on the id', async () => {
    const { sql, values } = await runFetch({})

    expect(sql).not.toMatch(/id [<>] /)
    expect(values.slice(0, 3)).toEqual([surveyInfo.uuid, null, 30])
  })

  test('the activity types and the limit keep their positions', async () => {
    const { sql, values } = await runFetch({ activityTypes: ['a', 'b'], limit: 5, idLessThan: 9 })

    expect(values.slice(0, 3)).toEqual([surveyInfo.uuid, ['a', 'b'], 5])
    expect(sql).toContain('$2:csv')
    expect(sql).toContain('$3::int')
  })
})
