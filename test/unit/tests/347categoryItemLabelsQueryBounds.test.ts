import {
  countItemsMissingLabels,
  fetchItemsMissingLabels,
} from '@server/modules/category/repository/categoryItemLabelsRepository'

jest.mock('@server/db/db', () => ({ db: {} }))

const pgStatementTimeoutCode = '57014'

/**
 * Builds a database client double with a transaction: the statements run in it are recorded in order.
 * @param {object} [options] - The options.
 * @param {unknown} [options.failure] - The error thrown by the query itself.
 * @returns {{client: object, statements: string[]}} The client and the recorded statements.
 */
const createClient = ({ failure = null }: { failure?: unknown } = {}) => {
  const statements: string[] = []
  const t = {
    none: async (sql: string, params: unknown[]) => {
      statements.push(`${sql} ${JSON.stringify(params)}`)
    },
    any: async (sql: string) => {
      statements.push(sql.trim().slice(0, 20))
      if (failure) throw failure
      return []
    },
    one: async (sql: string) => {
      statements.push(sql.trim().slice(0, 20))
      if (failure) throw failure
      return { total: 0, items: [] }
    },
  }
  return { client: { tx: async (fn: (t: unknown) => Promise<unknown>) => fn(t) }, statements }
}

const pageParams = { surveyId: 1, categoryUuid: 'c', lang: 'fr', langs: ['en', 'fr'], cursor: null, limit: 51 }

describe('the missing labels queries are bounded in time (347)', () => {
  test('the counts run in a transaction with a statement timeout', async () => {
    const { client, statements } = createClient()
    expect(await countItemsMissingLabels({ surveyId: 1, langs: ['en', 'fr'] }, client)).toEqual({})
    expect(statements[0]).toMatch(/^SET LOCAL statement_timeout = \$1 \["\d+ms"\]$/)
    expect(statements).toHaveLength(2)
  })

  test('the page runs in a transaction with a statement timeout', async () => {
    const { client, statements } = createClient()
    expect(await fetchItemsMissingLabels(pageParams, client)).toEqual({ total: 0, items: [] })
    expect(statements[0]).toMatch(/^SET LOCAL statement_timeout/)
    expect(statements).toHaveLength(2)
  })

  test.each([
    ['counts', (client: any) => countItemsMissingLabels({ surveyId: 1, langs: ['en', 'fr'] }, client)],
    ['page', (client: any) => fetchItemsMissingLabels(pageParams, client)],
  ])('a %s query that exceeds the timeout answers 503 categoryItemLabelsTooLarge', async (_name, run) => {
    const { client } = createClient({ failure: { code: pgStatementTimeoutCode } })
    await expect(run(client)).rejects.toMatchObject({
      key: 'appErrors:categoryItemLabelsTooLarge',
      statusCode: 503,
    })
  })

  test('another database error is not hidden', async () => {
    const failure = new Error('connection lost')
    const { client } = createClient({ failure })
    await expect(countItemsMissingLabels({ surveyId: 1, langs: ['en'] }, client)).rejects.toBe(failure)
  })
})
