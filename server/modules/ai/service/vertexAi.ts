/**
 * Google Vertex AI support: builds the `@ai-sdk/google-vertex` settings.
 *
 * The credential (stored in the API key field) can be:
 * - a service account JSON key: the project is taken from its `project_id` unless set explicitly;
 * - a Vertex AI API key (express mode).
 * Without a credential, the Application Default Credentials are used, but only for the admin default
 * configuration: a user must never be able to use the server identity with arbitrary settings.
 */
import { createVertex, type GoogleVertexProviderSettings } from '@ai-sdk/google-vertex'

import SystemError from '@core/systemError'

import { AiProvider } from '@common/ai/aiProvider'

export const DEFAULT_VERTEX_LOCATION = 'global'

const CLOUD_PLATFORM_SCOPE = 'https://www.googleapis.com/auth/cloud-platform'

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
