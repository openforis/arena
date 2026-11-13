import {
  buildVertexProviderSettings,
  isServiceAccountKeyCredential,
  listVertexModels,
  resolveVertexAuth,
} from '@server/modules/ai/service/vertexAi'

const serviceAccountKey = {
  type: 'service_account',
  project_id: 'sa-project',
  client_email: 'arena@sa-project.iam.gserviceaccount.com',
  private_key: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n',
}

describe('Vertex AI config', () => {
  test('a non-JSON credential is an express mode API key', () => {
    expect(buildVertexProviderSettings({ apiKey: ' AQ.key ' })).toEqual({ apiKey: 'AQ.key' })
  })

  test('a service account key provides credentials and project, location defaults to global', () => {
    const settings = buildVertexProviderSettings({ apiKey: JSON.stringify(serviceAccountKey, null, 2) })
    expect(settings.apiKey).toBeUndefined()
    expect(settings.project).toBe('sa-project')
    expect(settings.location).toBe('global')
    expect(settings.googleAuthOptions?.credentials).toEqual({
      client_email: serviceAccountKey.client_email,
      private_key: serviceAccountKey.private_key,
    })
  })

  test('explicit project and location override the defaults', () => {
    const auth = resolveVertexAuth({
      apiKey: JSON.stringify(serviceAccountKey),
      project: 'other-project',
      location: 'europe-west1',
    })
    expect(auth.project).toBe('other-project')
    expect(auth.location).toBe('europe-west1')
  })

  test('a JSON credential that is not a service account key is rejected', () => {
    expect(() => resolveVertexAuth({ apiKey: '{"type":"authorized_user"}' })).toThrow(/aiVertexCredentialInvalid/)
    expect(() => resolveVertexAuth({ apiKey: '{not json' })).toThrow(/aiVertexCredentialInvalid/)
  })

  test('application default credentials are used only when allowed', () => {
    expect(() => resolveVertexAuth({ project: 'p' })).toThrow(/aiApiKeyMissing/)
    expect(buildVertexProviderSettings({ project: 'p', useApplicationDefaultCredentials: true })).toEqual({
      project: 'p',
      location: 'global',
    })
  })

  test('service account key credential detection', () => {
    expect(isServiceAccountKeyCredential(` ${JSON.stringify(serviceAccountKey)}`)).toBe(true)
    expect(isServiceAccountKeyCredential('AQ.key')).toBe(false)
    expect(isServiceAccountKeyCredential(null)).toBe(false)
  })

  test('models list is empty with an API key (the list API accepts only OAuth2 credentials)', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch')
    await expect(listVertexModels({ apiKey: 'AQ.key' })).resolves.toEqual([])
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})
