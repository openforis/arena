import { createAiSettingsCache, isAiSettingsFetchError } from '@webapp/components/ai/hooks/aiSettingsCache'

const SETTINGS = { featuresEnabled: true, featureToggles: { chat: true }, disabledFeatures: [] }

const httpError = (status: number, data?: unknown) => Object.assign(new Error('http'), { response: { status, data } })

/** Returns a cache whose requests are answered from the `answers` queue (an Error is thrown). */
const setup = (answers: Array<Record<string, unknown> | Error>) => {
  let calls = 0
  const cache = createAiSettingsCache({
    fetchSettings: async () => {
      calls += 1
      const answer = answers.shift()
      if (answer instanceof Error) throw answer
      return (answer ?? SETTINGS) as never
    },
  })
  return { cache, getCalls: () => calls }
}

describe('createAiSettingsCache (368)', () => {
  test('one fetch is shared by every consumer, then the result is kept', async () => {
    const { cache, getCalls } = setup([SETTINGS])
    const [first, second] = await Promise.all([cache.fetchOnce(), cache.fetchOnce()])
    expect(first).toBe(second)
    await cache.fetchOnce()
    expect(getCalls()).toBe(1)
    expect(cache.getSnapshot()).toBe(first)
  })

  test('listeners are told when the settings arrive and after a reset', async () => {
    const { cache } = setup([SETTINGS])
    let notified = 0
    cache.subscribe(() => {
      notified += 1
    })
    await cache.fetchOnce()
    expect(notified).toBe(1)
    cache.reset()
    expect(notified).toBe(2)
    expect(cache.getSnapshot()).toBeNull()
  })

  test('a network error hides AI for this call but is not kept: the next use asks again', async () => {
    const { cache, getCalls } = setup([new Error('network down'), SETTINGS])
    let notified = 0
    cache.subscribe(() => {
      notified += 1
    })
    const failed = await cache.fetchOnce()
    expect(isAiSettingsFetchError(failed)).toBe(true)
    expect(failed.featuresEnabled).toBe(false)
    expect(cache.getSnapshot()).toBeNull()
    expect(notified).toBe(0)

    const retried = await cache.fetchOnce()
    expect(getCalls()).toBe(2)
    expect(isAiSettingsFetchError(retried)).toBe(false)
    expect(cache.getSnapshot()).toBe(retried)
  })

  test('a server error (500) is also retried', async () => {
    const { cache, getCalls } = setup([httpError(500), SETTINGS])
    expect(isAiSettingsFetchError(await cache.fetchOnce())).toBe(true)
    expect(isAiSettingsFetchError(await cache.fetchOnce())).toBe(false)
    expect(getCalls()).toBe(2)
  })

  test.each([
    ['404', httpError(404)],
    ['403', httpError(403)],
    ['aiFeaturesDisabled', httpError(400, { key: 'aiFeaturesDisabled' })],
  ])('%s is a lasting answer: AI is off and it is kept', async (_name, error) => {
    const { cache, getCalls } = setup([error])
    const result = await cache.fetchOnce()
    expect(result).toEqual({ featuresEnabled: false, featureToggles: {}, disabledFeatures: [] })
    expect(isAiSettingsFetchError(result)).toBe(false)
    await cache.fetchOnce()
    expect(getCalls()).toBe(1)
    expect(cache.getSnapshot()).toBe(result)
  })

  test('invalidate drops the cache and fetches again', async () => {
    const next = { ...SETTINGS, featureToggles: { chat: false } }
    const { cache, getCalls } = setup([SETTINGS, next])
    await cache.fetchOnce()
    cache.invalidate()
    expect(cache.getSnapshot()).toBeNull()
    expect(await cache.fetchOnce()).toEqual(next)
    expect(getCalls()).toBe(2)
  })

  test('a fetch that started before a reset cannot write its result', async () => {
    let release: (value: Record<string, unknown>) => void = () => undefined
    let calls = 0
    const cache = createAiSettingsCache({
      fetchSettings: () => {
        calls += 1
        return calls === 1
          ? new Promise((resolve) => {
              release = resolve as never
            })
          : Promise.resolve({ ...SETTINGS, accessLevel: 3 })
      },
    })
    const stale = cache.fetchOnce()
    cache.reset()
    release({ ...SETTINGS, accessLevel: 1 })
    await stale
    expect(cache.getSnapshot()).toBeNull()
    expect(await cache.fetchOnce()).toMatchObject({ accessLevel: 3 })
  })
})
