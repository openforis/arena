import { createUserServiceWithPrefsUpdate } from '@server/modules/user/service/userServicePrefsOverride'

describe('User service with a working updateUserPrefs (312)', () => {
  const base = {
    get: jest.fn(),
    updateUserPrefs: () => {
      throw new Error('TODO')
    },
  }

  test('the stub of arena-server is replaced and the other methods are kept', async () => {
    const updated = { uuid: 'u1', authGroups: [] }
    const update = jest.fn(async () => updated)
    const service = createUserServiceWithPrefsUpdate(base, update)
    expect(service.get).toBe(base.get)
    await expect(service.updateUserPrefs({ userToUpdate: { uuid: 'u1', prefs: {} } })).resolves.toBe(updated)
  })

  test('the write never carries the server-only prefs and keeps the others', async () => {
    const update = jest.fn(async (user: any) => user)
    const service = createUserServiceWithPrefsUpdate(base, update)
    const userToUpdate = {
      uuid: 'u1',
      prefs: { language: 'en', surveys: { current: 3 }, ai: { providers: [{ apiKeyEncrypted: 'v2:x' }] }, aiUsage: {} },
    }
    await service.updateUserPrefs({ userToUpdate })
    expect(update).toHaveBeenCalledWith({ uuid: 'u1', prefs: { language: 'en', surveys: { current: 3 } } })
    expect(userToUpdate.prefs.ai).toBeDefined()
  })
})
