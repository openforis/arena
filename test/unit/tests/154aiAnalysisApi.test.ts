import { Query } from '@common/model/query'

import { createAnalysisApi } from '@webapp/ai/tools/analysis/analysisApi'
import { createAnalysisQueryStore } from '@webapp/ai/tools/analysis/queryStore'
import { fitListToBudget, toolError } from '@webapp/ai/tools/analysis/toolResults'

import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'

const newFakeHttp = (respond: (call: any) => unknown) => {
  const calls: any[] = []
  const handle = async (call: any) => {
    calls.push(call)
    return respond(call)
  }
  return {
    calls,
    http: {
      get: (url: string, options: any) => handle({ method: 'get', url, ...options }),
      post: (url: string, body: any, options: any) => handle({ method: 'post', url, body, ...options }),
    },
  }
}
const query = Query.assocAttributeDefUuids(['a1'])(Query.create({ entityDefUuid: 'e1' }))

describe('analysis API', () => {
  test('query rows: Explorer endpoint, limit and timeout always sent', async () => {
    const { http, calls } = newFakeHttp(() => [{ a: 1 }])
    const api = createAnalysisApi({ http })
    expect(await api.fetchQueryRows({ surveyId: 3, cycle: '0', query, limit: 50 })).toEqual([{ a: 1 }])
    expect(calls[0]).toMatchObject({
      method: 'post',
      url: '/api/surveyRdb/3/e1/query',
      body: { cycle: '0', query, limit: 50, offset: 0 },
      timeout: 60000,
    })
  })

  test('query rows: refuses to run without a limit', async () => {
    const { http, calls } = newFakeHttp(() => [])
    const api = createAnalysisApi({ http })
    await expect(api.fetchQueryRows({ surveyId: 3, cycle: '0', query, limit: undefined as any })).rejects.toThrow(
      'limit'
    )
    await expect(api.fetchQueryRows({ surveyId: 3, cycle: '0', query, limit: 0 })).rejects.toThrow('limit')
    expect(calls).toHaveLength(0)
  })

  test('count: query sent as an object, number returned', async () => {
    const { http, calls } = newFakeHttp(() => '42')
    const api = createAnalysisApi({ http })
    expect(await api.fetchQueryCount({ surveyId: 3, cycle: '0', query })).toBe(42)
    expect(calls[0]).toMatchObject({ url: '/api/surveyRdb/3/e1/query/count', body: { cycle: '0', query } })
  })

  test.each([[{ code: 'ECONNABORTED' }], [{ code: 'ETIMEDOUT' }], [{ response: { status: 504 } }]])(
    'timeout %p becomes queryTimeout',
    async (failure) => {
      const { http } = newFakeHttp(() => Promise.reject(Object.assign(new Error('timeout'), failure)))
      const api = createAnalysisApi({ http })
      await expectSystemErrorKey(api.fetchQueryRows({ surveyId: 3, cycle: '0', query, limit: 10 }), 'queryTimeout')
      await expectSystemErrorKey(api.fetchQueryCount({ surveyId: 3, cycle: '0', query }), 'queryTimeout')
    }
  )

  test('timeouts of the other calls become queryTimeout too', async () => {
    const { http } = newFakeHttp(() => Promise.reject(Object.assign(new Error('timeout'), { code: 'ECONNABORTED' })))
    const api = createAnalysisApi({ http })
    await expectSystemErrorKey(api.fetchRecordsCountByStep({ surveyId: 3, cycle: '0' }), 'queryTimeout')
    await expectSystemErrorKey(
      api.fetchRecordsCountByDay({ surveyId: 3, cycle: '0', from: '2024-01-01', to: '2024-01-31' }),
      'queryTimeout'
    )
    await expectSystemErrorKey(
      api.fetchCategoryItems({ surveyId: 3, categoryUuid: 'c1', search: '', lang: 'en', draft: false }),
      'queryTimeout'
    )
  })

  test('the abort signal reaches the http layer', async () => {
    const { http, calls } = newFakeHttp(() => '1')
    const api = createAnalysisApi({ http })
    const { signal } = new AbortController()
    await api.fetchQueryCount({ surveyId: 3, cycle: '0', query, signal })
    await api.fetchQueryRows({ surveyId: 3, cycle: '0', query, limit: 5, signal })
    expect(calls[0].signal).toBe(signal)
    expect(calls[1].signal).toBe(signal)
  })

  test('count: a non-numeric response is an error, not NaN', async () => {
    const { http } = newFakeHttp(() => 'oops')
    const api = createAnalysisApi({ http })
    await expect(api.fetchQueryCount({ surveyId: 3, cycle: '0', query })).rejects.toThrow('count')
  })

  test('other errors are re-thrown as they are', async () => {
    const failure = Object.assign(new Error('forbidden'), { response: { status: 403 } })
    const { http } = newFakeHttp(() => Promise.reject(failure))
    const api = createAnalysisApi({ http })
    await expect(api.fetchQueryCount({ surveyId: 3, cycle: '0', query })).rejects.toBe(failure)
  })

  test('record counts: never the per-user count', async () => {
    const { http, calls } = newFakeHttp(() => [])
    const api = createAnalysisApi({ http })
    await api.fetchRecordsCountByStep({ surveyId: 3, cycle: '0' })
    await api.fetchRecordsCountByDay({ surveyId: 3, cycle: '0', from: '2024-01-01', to: '2024-01-31' })
    expect(calls[0]).toMatchObject({ url: '/api/survey/3/records/count/by-step', params: { cycle: '0' } })
    expect(calls[1]).toMatchObject({
      url: '/api/survey/3/records/dashboard/count',
      params: { cycle: '0', from: '2024-01-01', to: '2024-01-31', countType: 'default' },
    })
  })

  test('category items: search on the first level', async () => {
    const { http, calls } = newFakeHttp(() => ({ items: { u1: { uuid: 'u1' }, u2: { uuid: 'u2' } } }))
    const api = createAnalysisApi({ http })
    const items = await api.fetchCategoryItems({
      surveyId: 3,
      categoryUuid: 'c1',
      search: 'pin',
      lang: 'en',
      draft: false,
    })
    expect(items).toEqual([{ uuid: 'u1' }, { uuid: 'u2' }])
    expect(calls[0]).toMatchObject({
      url: '/api/survey/3/categories/c1/items',
      params: { draft: false, search: 'pin', lang: 'en' },
    })
    expect(calls[0].params).not.toHaveProperty('parentUuid')
  })
})

describe('analysis query store', () => {
  test('ids are sequential per conversation and survive a reload', () => {
    const changes: any[] = []
    const store = createAnalysisQueryStore({ onChange: (queries) => changes.push(queries), now: () => 'T' })
    const first = store.add({ query, explanation: 'E1', entityName: 'tree', mode: 'raw' })
    const second = store.add({ query, explanation: 'E2', entityName: 'tree', mode: 'raw' })
    expect([first.id, second.id]).toEqual(['q1', 'q2'])
    expect(store.get('q2')).toEqual({
      id: 'q2',
      query,
      explanation: 'E2',
      entityName: 'tree',
      mode: 'raw',
      createdAt: 'T',
    })
    expect(Object.keys(changes[1])).toEqual(['q1', 'q2'])

    const reloaded = createAnalysisQueryStore({ queries: changes[1] })
    expect(reloaded.add({ query, explanation: 'E3', entityName: 'tree', mode: 'raw' }).id).toBe('q3')
  })

  test('unknown ids return null', () => {
    const store = createAnalysisQueryStore()
    for (const id of ['q1', '', 'toString', '__proto__', 7, null, { id: 'q1' }]) {
      expect(store.get(id)).toBeNull()
    }
  })
})

describe('tool result helpers', () => {
  test('structured error', () => {
    expect(toolError('unknownQuery', 'Unknown')).toEqual({ error: { code: 'unknownQuery', message: 'Unknown' } })
  })

  test('lists are cut to the JSON budget', () => {
    const rows = Array.from({ length: 500 }, (_, idx) => [idx, 'x'.repeat(30)])
    const fitted = fitListToBudget({ rows, total: 500 }, 'rows', 2000)
    expect(JSON.stringify(fitted).length).toBeLessThanOrEqual(2000)
    expect(fitted.truncated).toBe(true)
    expect(fitted.rows.length).toBeGreaterThan(0)
    const small = { rows: [[1]], total: 1 }
    expect(fitListToBudget(small, 'rows', 2000)).toBe(small)
  })
})
