import { db } from '@server/db/db'
import { chargeAiUsage } from '@server/modules/ai/repository/aiUsageRepository'

const DAY = '2026-10-15'
const NEXT_DAY = '2026-10-16'

const insertUser = async (prefs: object = {}): Promise<string> => {
  const email = `ai_budget_${Date.now()}_${Math.random().toString(36).slice(2)}@openforis.org`
  const { uuid } = await db.one(
    `INSERT INTO "user" (name, email, password, status, prefs)
     VALUES ('Budget', $1, 'test_password', 'ACCEPTED', $2::jsonb)
     RETURNING uuid`,
    [email, JSON.stringify(prefs)]
  )
  return uuid
}

const readPrefs = async (userUuid: string): Promise<any> =>
  (await db.one(`SELECT prefs FROM "user" WHERE uuid = $1`, [userUuid])).prefs

describe('AI daily budget of the Arena default provider: the conditional update (057)', () => {
  const userUuids: string[] = []
  const createUser = async (prefs: object = {}) => {
    const uuid = await insertUser(prefs)
    userUuids.push(uuid)
    return uuid
  }
  const limits = { callLimit: 3, charLimit: 100 }

  afterAll(async () => {
    if (userUuids.length > 0) await db.none(`DELETE FROM "user" WHERE uuid IN ($1:csv)`, [userUuids])
  })

  test('the first call of the day starts the counters', async () => {
    const userUuid = await createUser()
    expect(await chargeAiUsage({ userUuid, day: DAY, chars: 10, ...limits })).toEqual({ day: DAY, calls: 1, chars: 10 })
    expect((await readPrefs(userUuid)).aiUsage).toEqual({ day: DAY, calls: 1, chars: 10 })
  })

  test('the calls limit is reached: the call over it is refused and nothing changes', async () => {
    const userUuid = await createUser()
    for (let calls = 1; calls <= 3; calls += 1) {
      expect(await chargeAiUsage({ userUuid, day: DAY, chars: 1, ...limits })).toEqual({
        day: DAY,
        calls,
        chars: calls,
      })
    }
    expect(await chargeAiUsage({ userUuid, day: DAY, chars: 1, ...limits })).toBeNull()
    expect((await readPrefs(userUuid)).aiUsage).toEqual({ day: DAY, calls: 3, chars: 3 })
  })

  test('the characters limit is reached: a call that does not fit is refused, a smaller one still fits', async () => {
    const userUuid = await createUser()
    expect(await chargeAiUsage({ userUuid, day: DAY, chars: 60, ...limits })).toMatchObject({ calls: 1, chars: 60 })
    expect(await chargeAiUsage({ userUuid, day: DAY, chars: 50, ...limits })).toBeNull()
    expect(await chargeAiUsage({ userUuid, day: DAY, chars: 40, ...limits })).toMatchObject({ calls: 2, chars: 100 })
    expect(await chargeAiUsage({ userUuid, day: DAY, chars: 1, ...limits })).toBeNull()
  })

  test('a single call bigger than the characters limit is refused even on a fresh day', async () => {
    const userUuid = await createUser()
    expect(await chargeAiUsage({ userUuid, day: DAY, chars: 101, ...limits })).toBeNull()
    expect((await readPrefs(userUuid)).aiUsage).toBeUndefined()
  })

  test('a new day resets the counters', async () => {
    const userUuid = await createUser()
    for (let call = 0; call < 3; call += 1) await chargeAiUsage({ userUuid, day: DAY, chars: 30, ...limits })
    expect(await chargeAiUsage({ userUuid, day: DAY, chars: 1, ...limits })).toBeNull()
    expect(await chargeAiUsage({ userUuid, day: NEXT_DAY, chars: 5, ...limits })).toEqual({
      day: NEXT_DAY,
      calls: 1,
      chars: 5,
    })
    expect((await readPrefs(userUuid)).aiUsage).toEqual({ day: NEXT_DAY, calls: 1, chars: 5 })
  })

  test('0 means unlimited for that limit, and the usage is still counted', async () => {
    const userUuid = await createUser()
    for (let call = 0; call < 5; call += 1) {
      expect(await chargeAiUsage({ userUuid, day: DAY, chars: 1000, callLimit: 0, charLimit: 0 })).not.toBeNull()
    }
    expect((await readPrefs(userUuid)).aiUsage).toEqual({ day: DAY, calls: 5, chars: 5000 })
    expect(await chargeAiUsage({ userUuid, day: DAY, chars: 1000, callLimit: 5, charLimit: 0 })).toBeNull()
    expect(await chargeAiUsage({ userUuid, day: DAY, chars: 1000, callLimit: 0, charLimit: 5000 })).toBeNull()
  })

  test('the other preferences of the user are kept', async () => {
    const ai = { providers: [{ id: 'acct:1' }], defaultProviderId: 'acct:1' }
    const userUuid = await createUser({ ai, lang: 'es', surveys: { current: '3' } })
    await chargeAiUsage({ userUuid, day: DAY, chars: 10, ...limits })
    expect(await readPrefs(userUuid)).toEqual({
      ai,
      lang: 'es',
      surveys: { current: '3' },
      aiUsage: { day: DAY, calls: 1, chars: 10 },
    })
  })

  test('a damaged usage value counts as zero instead of failing the call', async () => {
    const userUuid = await createUser({ aiUsage: { day: DAY, calls: 'many', chars: { n: 1 } } })
    expect(await chargeAiUsage({ userUuid, day: DAY, chars: 10, ...limits })).toEqual({ day: DAY, calls: 1, chars: 10 })
    const textUsage = await createUser({ aiUsage: 'garbage' })
    expect(await chargeAiUsage({ userUuid: textUsage, day: DAY, chars: 10, ...limits })).toMatchObject({ calls: 1 })
  })

  test('an unknown user is refused', async () => {
    const unknown = '11111111-1111-4111-8111-111111111111'
    expect(await chargeAiUsage({ userUuid: unknown, day: DAY, chars: 1, ...limits })).toBeNull()
  })

  test('concurrent calls never exceed the calls limit', async () => {
    const userUuid = await createUser()
    const results = await Promise.all(
      Array.from({ length: 25 }, () => chargeAiUsage({ userUuid, day: DAY, chars: 1, callLimit: 7, charLimit: 0 }))
    )
    expect(results.filter(Boolean)).toHaveLength(7)
    expect((await readPrefs(userUuid)).aiUsage).toEqual({ day: DAY, calls: 7, chars: 7 })
  })

  test('concurrent calls never exceed the characters limit', async () => {
    const userUuid = await createUser()
    const results = await Promise.all(
      Array.from({ length: 20 }, () => chargeAiUsage({ userUuid, day: DAY, chars: 30, callLimit: 0, charLimit: 100 }))
    )
    expect(results.filter(Boolean)).toHaveLength(3)
    expect((await readPrefs(userUuid)).aiUsage).toEqual({ day: DAY, calls: 3, chars: 90 })
  })

  test('concurrent calls on the first call of a new day count once each', async () => {
    const userUuid = await createUser({ aiUsage: { day: DAY, calls: 3, chars: 99 } })
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        chargeAiUsage({ userUuid, day: NEXT_DAY, chars: 1, callLimit: 4, charLimit: 100 })
      )
    )
    expect(results.filter(Boolean)).toHaveLength(4)
    expect((await readPrefs(userUuid)).aiUsage).toEqual({ day: NEXT_DAY, calls: 4, chars: 4 })
  })
})
