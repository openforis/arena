import { isAllowlisted } from '@common/ai/allowlist'
import { isAllowlisted as guardIsAllowlisted } from '@server/modules/ai/service/baseUrlGuard'

const allowlist = ['http://10.0.0.5:8000/v1', 'https://llm.internal.example/api/']

describe('isAllowlisted (common)', () => {
  test.each([
    ['http://10.0.0.5:8000/v1', true],
    ['http://10.0.0.5:8000/v1/', true],
    ['http://10.0.0.5:8000/v1/chat/completions', true],
    ['http://10.0.0.5:8000/v10', false],
    ['http://10.0.0.5:8001/v1', false],
    ['https://10.0.0.5:8000/v1', false],
    ['https://LLM.INTERNAL.example/api', true],
    ['https://llm.internal.example/api/models', true],
    ['https://llm.internal.example/apis', false],
    ['https://llm.internal.example/', false],
  ])('%s → %s', (url, expected) => {
    expect(isAllowlisted(new URL(url), allowlist)).toBe(expected)
  })

  test('ignores invalid and non-string entries', () => {
    expect(isAllowlisted(new URL('http://10.0.0.5/'), ['not a url', '', null as unknown as string])).toBe(false)
  })

  test('an empty allowlist allows nothing', () => {
    expect(isAllowlisted(new URL('http://10.0.0.5:8000/v1'), [])).toBe(false)
  })

  test('baseUrlGuard re-exports the shared function', () => {
    expect(guardIsAllowlisted).toBe(isAllowlisted)
  })
})
