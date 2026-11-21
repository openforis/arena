import { createUserServiceWithPrefsUpdate } from '@server/modules/user/service/userServicePrefsOverride'

describe('User service with a working updateUserPrefs (312)', () => {
  const base = {
    get: jest.fn(),
    updateUserPrefs: (_options: { userToUpdate: unknown }): Promise<unknown> => {
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
})
