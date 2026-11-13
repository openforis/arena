/**
 * Google Vertex AI support: builds the `@ai-sdk/google-vertex` settings and lists the available Gemini models.
 *
 * The credential (stored in the API key field) can be:
 * - a service account JSON key: the project is taken from its `project_id` unless set explicitly;
 * - a Vertex AI API key (express mode).
 * Without a credential, the Application Default Credentials are used, but only for the admin default
 * configuration: a user must never be able to use the server identity with arbitrary settings.
 */
import { createVertex, type GoogleVertexProviderSettings } from '@ai-sdk/google-vertex'
import { GoogleAuth } from 'google-auth-library'

import SystemError from '@core/systemError'

import { AiProvider } from '@common/ai/aiProvider'

export const DEFAULT_VERTEX_LOCATION = 'global'

const CLOUD_PLATFORM_SCOPE = 'https://www.googleapis.com/auth/cloud-platform'
const MODELS_LIST_URL = 'https://aiplatform.googleapis.com/v1beta1/publishers/google/models'
const MODELS_LIST_MAX_PAGES = 10
const DEFAULT_TIMEOUT_MS = 10000

type ServiceAccountKey = {
  type: string
  project_id?: string
  client_email: string
  private_key: string
}

export type VertexConfig = {
  apiKey?: string | null
  project?: string | null
  location?: string | null
  useApplicationDefaultCredentials?: boolean
}

type ResolvedVertexAuth = {
  serviceAccount: ServiceAccountKey | null
  apiKey: string | null
  project: string | null
  location: string
}

const parseServiceAccount = (credential: string): ServiceAccountKey | null => {
  const trimmed = credential.trim()
  if (!trimmed.startsWith('{')) return null
  let json: any
  try {
    json = JSON.parse(trimmed)
  } catch {
    throw new SystemError('aiVertexCredentialInvalid')
  }
  if (json?.type !== 'service_account' || !json.client_email || !json.private_key) {
    throw new SystemError('aiVertexCredentialInvalid')
  }
  return json as ServiceAccountKey
}

/**
 * Resolves the authentication method and the project/location of a Vertex AI configuration.
 * @param {VertexConfig} cfg - The provider configuration.
 * @returns {ResolvedVertexAuth} The resolved authentication settings.
 */
export const resolveVertexAuth = (cfg: VertexConfig): ResolvedVertexAuth => {
  const { apiKey, project, location, useApplicationDefaultCredentials = false } = cfg
  const credential = apiKey?.trim() || null
  if (!credential && !useApplicationDefaultCredentials) {
    throw new SystemError('aiApiKeyMissing', { provider: AiProvider.googleVertex })
  }
  const serviceAccount = credential ? parseServiceAccount(credential) : null
  return {
    serviceAccount,
    apiKey: credential && !serviceAccount ? credential : null,
    project: project?.trim() || serviceAccount?.project_id || null,
    location: location?.trim() || DEFAULT_VERTEX_LOCATION,
  }
}

/**
 * Builds the settings for `createVertex`.
 * @param {VertexConfig} cfg - The provider configuration.
 * @returns {GoogleVertexProviderSettings} The Vertex provider settings.
 */
export const buildVertexProviderSettings = (cfg: VertexConfig): GoogleVertexProviderSettings => {
  const { serviceAccount, apiKey, project, location } = resolveVertexAuth(cfg)
  if (apiKey) {
    // Express mode: the SDK sends the key in the x-goog-api-key header.
    return { apiKey }
  }
  const settings: GoogleVertexProviderSettings = { location }
  if (project) settings.project = project
  if (serviceAccount) {
    settings.googleAuthOptions = {
      credentials: { client_email: serviceAccount.client_email, private_key: serviceAccount.private_key },
      projectId: project ?? undefined,
      scopes: [CLOUD_PLATFORM_SCOPE],
    }
  }
  return settings
}

/**
 * Builds a Vertex AI language model handle.
 * @param {VertexConfig & {model: string}} cfg - The provider configuration.
 * @returns {object} The Vercel AI SDK language model.
 */
export const buildVertexModel = (cfg: VertexConfig & { model: string }) =>
  createVertex(buildVertexProviderSettings(cfg))(cfg.model)

const buildAuthHeaders = async (auth: ResolvedVertexAuth): Promise<Record<string, string>> => {
  const googleAuth = new GoogleAuth({
    scopes: [CLOUD_PLATFORM_SCOPE],
    ...(auth.serviceAccount
      ? {
          credentials: { client_email: auth.serviceAccount.client_email, private_key: auth.serviceAccount.private_key },
        }
      : {}),
    ...(auth.project ? { projectId: auth.project } : {}),
  })
  const token = await googleAuth.getAccessToken()
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
  if (auth.project) headers['x-goog-user-project'] = auth.project
  return headers
}

const fetchModelsPage = async ({ headers, pageToken }: { headers: Record<string, string>; pageToken?: string }) => {
  const url = new URL(MODELS_LIST_URL)
  url.searchParams.set('pageSize', '100')
  if (pageToken) url.searchParams.set('pageToken', pageToken)
  const response = await fetch(url, {
    headers: { Accept: 'application/json', ...headers },
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    const bodySuffix = body ? ` — ${body.slice(0, 200)}` : ''
    throw new Error(`HTTP ${response.status}${bodySuffix}`)
  }
  return response.json()
}

// Only the Gemini text models can be used by the Arena AI features.
const isGeminiTextModel = (id: string): boolean =>
  id.startsWith('gemini') && !['embedding', 'image', 'tts', 'live', 'audio'].some((needle) => id.includes(needle))

/**
 * Lists the Gemini models published on Vertex AI.
 * Returns an empty list with an API key: the models list API accepts only OAuth2 credentials, the model id is typed.
 * @param {VertexConfig} cfg - The provider configuration.
 * @returns {Promise<Array<{id: string}>>} The models.
 */
export const listVertexModels = async (cfg: VertexConfig): Promise<Array<{ id: string }>> => {
  const auth = resolveVertexAuth(cfg)
  if (auth.apiKey) return []
  const headers = await buildAuthHeaders(auth)
  const ids = new Set<string>()
  let pageToken: string | undefined
  for (let page = 0; page < MODELS_LIST_MAX_PAGES; page++) {
    const json = await fetchModelsPage({ headers, pageToken })
    for (const model of json?.publisherModels ?? []) {
      const id = typeof model?.name === 'string' ? model.name.split('/').pop() : null
      if (id && isGeminiTextModel(id)) ids.add(id)
    }
    pageToken = json?.nextPageToken
    if (!pageToken) break
  }
  return [...ids].sort((a, b) => a.localeCompare(b)).map((id) => ({ id }))
}
