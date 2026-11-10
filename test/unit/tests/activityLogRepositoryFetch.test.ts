import { fetch } from '@server/modules/activityLog/repository/activityLogRepository'

const surveyInfo = { id: 1, uuid: 'survey-uuid', published: false }

/**
 * Fetches the activity logs with a fake client capturing the query and its values (no DB in unit tests).
 * @param {object} params - Params passed to the repository fetch function.
 * @returns {Promise<{query: string, values: unknown[]}>} The captured query and values.
 */
const captureFetchQuery = async (
  params: Record<string, unknown> = {}
): Promise<{ query: string; values: unknown[] }> => {
  const captured: { query: string; values: unknown[] } = { query: '', values: [] }
  const client: any = {
    map: async (query: string, values: unknown[]) => {
      captured.query = query.replaceAll(/\s+/g, ' ')
      captured.values = values
      return []
    },
  }
  await fetch({ surveyInfo, client, ...params } as any)
  return captured
}

describe('activityLogRepository.fetch', () => {
  it('binds idGreaterThan as a query parameter', async () => {
    const { query, values } = await captureFetchQuery({ idGreaterThan: 12345 })

    expect(query).not.toContain('12345')
    expect(query.match(/id > \$4/g)).toHaveLength(2)
    expect(values[3]).toBe(12345)
  })

  it('binds idLessThan as a query parameter', async () => {
    const { query, values } = await captureFetchQuery({ idLessThan: 12345 })

    expect(query).not.toContain('12345')
    expect(query.match(/id < \$5/g)).toHaveLength(2)
    expect(values[4]).toBe(12345)
  })

  it('does not filter by id when no id filter is specified', async () => {
    const { query } = await captureFetchQuery()

    expect(query).not.toMatch(/id [<>] \$/)
  })

  it.each([
    ['ASC', 'ASC'],
    ['asc', 'ASC'],
    ['DESC', 'DESC'],
    [undefined, 'DESC'],
    ['date_created DESC', 'DESC'],
  ])('sorts by id with direction %s => %s', async (orderBy, expectedDirection) => {
    const { query } = await captureFetchQuery({ orderBy })

    expect(query.trim().endsWith(`ORDER BY l.id ${expectedDirection}`)).toBe(true)
  })
})
