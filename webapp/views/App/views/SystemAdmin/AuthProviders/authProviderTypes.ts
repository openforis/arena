export type AuthProviderType = 'oidc' | 'google' | 'microsoft'

export interface AdminAuthProvider {
  id: string
  type: AuthProviderType
  source: 'db' | 'env'
  label: string
  enabled: boolean
  showOnLoginPage: boolean
  order: number
  issuer?: string
  tenant?: string
  clientId: string
  scopes: string[]
  allowedEmailDomains: string[]
  trustEmail: boolean
  requireArena2FA: boolean
  iconKind: 'builtin' | 'uploaded' | 'generic'
  hasClientSecret: boolean
  iconMime?: string
  dateCreated?: string
  dateModified?: string
  linkedUsersCount: number
  issuerUrl: string
  redirectUri: string
}

export const authProviderTypes: AuthProviderType[] = ['google', 'microsoft', 'oidc']

export const newProviderId = '_new'

const trimHyphens = (value: string): string => {
  let start = 0
  let end = value.length
  while (start < end && value[start] === '-') start += 1
  while (end > start && value[end - 1] === '-') end -= 1
  return value.substring(start, end)
}

// suggested identifier: lowercase letters, digits and hyphens
export const toProviderId = (label: string): string =>
  trimHyphens(
    label
      .toLowerCase()
      .normalize('NFD')
      .replaceAll(/[\u0300-\u036f]/g, '')
      .replaceAll(/[^a-z0-9]+/g, '-')
  ).substring(0, 63)

export const createNewProvider = (type: AuthProviderType): Partial<AdminAuthProvider> => ({
  type,
  source: 'db',
  label: { google: 'Google', microsoft: 'Microsoft', oidc: '' }[type],
  enabled: true,
  showOnLoginPage: true,
  clientId: '',
  scopes: ['openid', 'email', 'profile'],
  allowedEmailDomains: [],
  trustEmail: false,
  requireArena2FA: true,
  iconKind: type === 'oidc' ? 'generic' : 'builtin',
  tenant: type === 'microsoft' ? 'common' : undefined,
})
