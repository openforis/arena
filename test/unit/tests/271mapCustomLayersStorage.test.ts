import type { MapCustomLayer } from '@core/map/customLayers/mapCustomLayer'
import {
  MapCustomLayersRepository,
  type MapCustomLayersDbClient,
  type MapCustomLayersRepository as MapCustomLayersRepositoryType,
} from '@server/modules/geo/repository/mapCustomLayersRepository'
import { createMapCustomLayersService } from '@server/modules/geo/service/mapCustomLayersService'
import {
  deleteUserMapCustomLayersSurvey,
  deleteUserPrefsSurvey,
  deleteUsersPrefsSurvey,
  fetchUserByUuid,
  fetchUsers,
  fetchUsersBySurveyId,
  updateUserPrefs,
} from '@server/modules/user/repository/userRepository'

type RecordedCall = { method: string; query: string; values: unknown }

const layer: MapCustomLayer = {
  id: '5f0c7a4e-8a3b-4c1d-9e2f-0a1b2c3d4e5f',
  kind: 'xyz',
  role: 'overlay',
  name: 'Roads',
  url: 'https://tiles.example.org/{z}/{x}/{y}.png',
  format: 'image/png',
  opacity: 0.8,
  attribution: '',
}

/**
 * Creates a fake pg-promise client recording every query.
 * @param {unknown} row - The row every query returns.
 * @returns {object} The client and the recorded calls.
 */
const fakeClient = (row: unknown = null) => {
  const calls: RecordedCall[] = []
  /**
   * Records a call and answers with the row.
   * @param {string} method - The client method.
   * @returns {Function} The fake method.
   */
  const record =
    (method: string) =>
    async (query: string, values: unknown, callback?: (value: unknown) => unknown): Promise<unknown> => {
      calls.push({ method, query, values })
      return callback ? callback(row) : row
    }
  const client = {
    map: record('map'),
    none: record('none'),
    one: record('one'),
    oneOrNone: record('oneOrNone'),
    query: record('query'),
  }
  return { client, calls }
}

/**
 * Creates a fake repository whose methods return the given values.
 * @param {Partial<MapCustomLayersRepositoryType>} overrides - The methods.
 * @returns {MapCustomLayersRepositoryType} The repository.
 */
const fakeRepository = (overrides: Partial<MapCustomLayersRepositoryType>): MapCustomLayersRepositoryType => ({
  ...MapCustomLayersRepository,
  ...overrides,
})

/**
 * Runs a request and returns the key of the error it fails with.
 * @param {Promise<unknown>} promise - The request.
 * @returns {Promise<string>} The error key.
 */
const errorKeyOf = async (promise: Promise<unknown>): Promise<string> => {
  try {
    await promise
  } catch (error) {
    return (error as { key: string }).key
  }
  return 'no error'
}

describe('map custom layers storage (271)', () => {
  test('appends survey layers in one statement guarded by the limit', async () => {
    const { client, calls } = fakeClient({ layers: [layer] })
    const result = await MapCustomLayersRepository.appendSurveyMapCustomLayers(
      { surveyId: 7, layers: [layer], max: 50 },
      client as unknown as MapCustomLayersDbClient
    )
    expect(result).toEqual([layer])
    expect(calls[0].query).toContain("coalesce(config -> 'mapCustomLayers', '[]'::jsonb) || (SELECT")
    // ids already stored are skipped, and only the effective additions count for the limit
    expect(calls[0].query).toContain("saved.layer ->> 'id' = incoming.layer ->> 'id'")
    expect(calls[0].query).toContain('+ jsonb_array_length((SELECT')
    expect(calls[0].query).toContain('<= $/max/')
    expect(calls[0].values).toEqual({ surveyId: 7, layers: [layer], max: 50 })
  })

  test('returns null when the limit stops the update, and drops malformed stored layers', async () => {
    const limited = fakeClient(null)
    expect(
      await MapCustomLayersRepository.appendUserMapCustomLayers(
        { userUuid: 'u1', surveyId: 7, layers: [layer], max: 50 },
        limited.client as unknown as MapCustomLayersDbClient
      )
    ).toBeNull()
    expect(limited.calls[0].values).toMatchObject({ surveyKey: '7', path: ['mapCustomLayers', '7'] })
    const stored = fakeClient({ layers: [layer, { id: 'x', kind: 'ftp' }] })
    expect(
      await MapCustomLayersRepository.fetchSurveyMapCustomLayers(
        { surveyId: 7 },
        stored.client as unknown as MapCustomLayersDbClient
      )
    ).toEqual([layer])
  })

  test('removes a layer keeping the order of the others', async () => {
    const { client, calls } = fakeClient({ layers: [] })
    await MapCustomLayersRepository.removeUserMapCustomLayer(
      { userUuid: 'u1', surveyId: 7, layerId: layer.id },
      client as unknown as MapCustomLayersDbClient
    )
    expect(calls[0].query).toContain('jsonb_agg(layer ORDER BY position)')
    expect(calls[0].query).toContain("WHERE layer ->> 'id' <> $/layerId/")
    expect(calls[0].values).toEqual({ userUuid: 'u1', path: ['mapCustomLayers', '7'], layerId: layer.id })
  })

  test('the service refuses invalid layers and reports the limit', async () => {
    const service = createMapCustomLayersService(
      fakeRepository({ appendSurveyMapCustomLayers: async () => null, appendUserMapCustomLayers: async () => [layer] })
    )
    const base = { surveyId: 7, userUuid: 'u1' }
    expect(
      await errorKeyOf(service.addMapCustomLayers({ ...base, scope: 'user', layers: [{ ...layer, url: 'ftp://x' }] }))
    ).toBe('appErrors:mapCustomLayers.invalidLayers')
    expect(await errorKeyOf(service.addMapCustomLayers({ ...base, scope: 'survey', layers: [layer] }))).toBe(
      'appErrors:mapCustomLayers.tooManyLayers'
    )
    expect(await service.addMapCustomLayers({ ...base, scope: 'user', layers: [layer] })).toEqual([layer])
  })

  test('the service returns an empty list when there was nothing to remove', async () => {
    const service = createMapCustomLayersService(fakeRepository({ removeSurveyMapCustomLayer: async () => null }))
    expect(await service.removeMapCustomLayer({ surveyId: 7, userUuid: 'u1', scope: 'survey', layerId: 'a' })).toEqual(
      []
    )
  })

  test('a prefs update sent by the client cannot overwrite the user layers', async () => {
    const { client, calls } = fakeClient({})
    const user = { uuid: 'u1', prefs: { language: 'en', mapCustomLayers: {} } }
    await updateUserPrefs(user, client as never)
    expect(calls[0].values).toEqual([{ language: 'en' }, 'u1'])
  })

  test('deleting a survey removes the user layers of that survey', async () => {
    const { client, calls } = fakeClient()
    await deleteUsersPrefsSurvey(7, client as never)
    expect(calls[1].query).toContain("#- '{mapCustomLayers,7}'")
  })

  test('removing a user from a survey removes the user layers of that survey', async () => {
    const { client, calls } = fakeClient()
    await deleteUserPrefsSurvey({ userUuid: 'u1', surveyId: 7 }, client as never)
    expect(calls[0].query).toContain('#- ARRAY[$/layersKey/, $/surveyId/]::text[]')
    expect(calls[0].values).toMatchObject({ layersKey: 'mapCustomLayers', surveyId: '7' })
  })

  test('removing a user from a survey drops the user layers whatever the current survey is', async () => {
    const { client, calls } = fakeClient()
    await deleteUserMapCustomLayersSurvey({ userUuid: 'u1', surveyId: 7 }, client as never)
    expect(calls[0].query).toContain('#- ARRAY[$/layersKey/, $/surveyId/]::text[]')
    expect(calls[0].query).not.toContain('current')
    expect(calls[0].values).toEqual({ userUuid: 'u1', layersKey: 'mapCustomLayers', surveyId: '7' })
  })

  test('the users selects never return the custom map layers', async () => {
    const { client, calls } = fakeClient()
    await fetchUserByUuid('u1', client as never)
    await fetchUsers({}, client as never)
    await fetchUsersBySurveyId({ surveyId: 7 }, client as never)
    const queries = calls.map((call) => call.query)
    expect(queries).toHaveLength(3)
    for (const query of queries) {
      expect(query).toContain("u.prefs - 'mapCustomLayers' AS prefs")
      expect(query).not.toMatch(/u\.prefs,/)
    }
  })
})
