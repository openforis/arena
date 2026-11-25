import { type ArenaUser, ServiceRegistry } from '@openforis/arena-core'
import type { AuthProvider, AuthProviderInput, AuthProviderService } from '@openforis/arena-server'
import { ServerServiceType } from '@openforis/arena-server'

import * as Log from '@server/log/log'
import * as Mailer from '@server/utils/mailer'

const logger = Log.getLogger('AuthProviderAdminService')

const connectionTestTimeoutMs = 10000

export const getAuthProviderService = (): AuthProviderService =>
  ServiceRegistry.getInstance().getService(ServerServiceType.authProvider) as AuthProviderService

export interface AuthProviderForAdmin extends AuthProvider {
  linkedUsersCount: number
  issuerUrl: string
  redirectUri: string
}

const toAdminProvider = (
  service: AuthProviderService,
  provider: AuthProvider,
  linkedCounts: Record<string, number>,
  baseUrl: string
): AuthProviderForAdmin => ({
  ...provider,
  linkedUsersCount: linkedCounts[provider.id] ?? 0,
  issuerUrl: service.getIssuer(provider),
  redirectUri: service.getRedirectUri(provider.id, baseUrl),
})

/**
 * Providers with the number of linked users and the redirect URI to register at the provider.
 */
export const fetchProviders = async ({ baseUrl }: { baseUrl: string }) => {
  const service = getAuthProviderService()
  const [providers, linkedCounts] = await Promise.all([service.getAll(), service.getLinkedUsersCountByProvider()])
  return {
    providers: providers.map((provider) => toAdminProvider(service, provider, linkedCounts, baseUrl)),
    secretEncryptionAvailable: service.isSecretEncryptionAvailable(),
    // redirect URI of a provider not saved yet (same public URL as the saved ones)
    redirectUriTemplate: service.getRedirectUri('{id}', baseUrl),
  }
}

export const fetchProvider = async ({ id, baseUrl }: { id: string; baseUrl: string }) => {
  const service = getAuthProviderService()
  const provider = await service.get(id)
  if (!provider) return null
  const linkedCounts = await service.getLinkedUsersCountByProvider()
  return toAdminProvider(service, provider, linkedCounts, baseUrl)
}

const logChange = (params: { user: ArenaUser; action: string; id: string; fields?: string[] }) => {
  const { user, action, id, fields } = params
  const fieldsText = fields?.length ? ` (${fields.join(', ')})` : ''
  logger.info(`auth provider "${id}" ${action} by ${user?.email}${fieldsText}`)
}

export const createProvider = async ({ user, input }: { user: ArenaUser; input: AuthProviderInput }) => {
  const provider = await getAuthProviderService().create(input)
  logChange({ user, action: 'created', id: provider.id })
  return provider
}

export const updateProvider = async ({
  user,
  id,
  props,
  clientSecret,
}: {
  user: ArenaUser
  id: string
  props: Partial<AuthProvider>
  clientSecret?: string
}) => {
  const provider = await getAuthProviderService().update({ id, props, clientSecret })
  // the secret value is never logged
  const fields = [...Object.keys(props), ...(clientSecret ? ['clientSecret'] : [])]
  logChange({ user, action: 'updated', id, fields })
  return provider
}

export const reorderProviders = async ({ user, ids }: { user: ArenaUser; ids: string[] }) => {
  await getAuthProviderService().reorder(ids)
  logChange({ user, action: 'reordered', id: ids.join(',') })
}

export const setProviderIcon = async ({
  user,
  id,
  file,
  mime,
}: {
  user: ArenaUser
  id: string
  file: Buffer | null
  mime: string | null
}) => {
  await getAuthProviderService().setIcon({ id, file, mime })
  logChange({ user, action: file ? 'icon set' : 'icon removed', id })
}

export const fetchUsersWithoutOtherSignInMethod = ({ id }: { id: string }) =>
  getAuthProviderService().getUsersWithoutOtherSignInMethod(id)

/**
 * Deletes a provider; optionally emails the users left without any sign-in method how to set a password.
 */
export const deleteProvider = async ({
  user,
  id,
  notifyUsers,
  serverUrl,
}: {
  user: ArenaUser
  id: string
  notifyUsers: boolean
  serverUrl: string
}) => {
  const service = getAuthProviderService()
  const provider = await service.get(id)
  const usersToNotify = notifyUsers ? await service.getUsersWithoutOtherSignInMethod(id) : []
  const { deletedIdentities } = await service.deleteItem(id)
  logChange({ user, action: 'deleted', id })
  const notifyUser = async (userToNotify: { email: string; name: string | null }) => {
    try {
      await Mailer.sendEmail({
        to: userToNotify.email,
        msgKey: 'emails:authProviderDeleted',
        msgParams: { name: userToNotify.name ?? '', providerLabel: provider?.label ?? id, serverUrl },
      })
    } catch (error) {
      logger.error(`error notifying ${userToNotify.email} of the deletion of provider "${id}": ${error.message}`)
    }
  }
  await Promise.all(usersToNotify.map(notifyUser))
  return { deletedIdentities, notifiedUsers: usersToNotify.length }
}

const fetchJson = async (url: string): Promise<{ [key: string]: unknown }> => {
  const response = await fetch(url, { signal: AbortSignal.timeout(connectionTestTimeoutMs) })
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
  return response.json()
}

/**
 * Loads the discovery document and the signing keys of a provider.
 */
export const testProviderConnection = async ({ id }: { id: string }) => {
  const service = getAuthProviderService()
  const provider = await service.get(id)
  if (!provider) return null
  const issuer = service.getIssuer(provider).replace(/\/$/, '')
  const start = Date.now()
  try {
    const metadata = await fetchJson(`${issuer}/.well-known/openid-configuration`)
    const jwksUri = metadata.jwks_uri
    const jwks = typeof jwksUri === 'string' && jwksUri ? await fetchJson(jwksUri) : {}
    return {
      ok: true,
      issuer: metadata.issuer,
      keysCount: Array.isArray(jwks.keys) ? jwks.keys.length : 0,
      durationMs: Date.now() - start,
    }
  } catch (error) {
    return { ok: false, error: error.message, durationMs: Date.now() - start }
  }
}
