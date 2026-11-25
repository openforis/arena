import axios from 'axios'

const adminPath = '/api/admin/auth-providers'

// ===== login page (public)
export const fetchLoginProviders = async () => {
  const { data } = await axios.get('/auth/providers')
  return data
}

/**
 * Start URL of a sign-in with an external provider (a full page navigation, not an API call).
 * @param {object} params - The parameters.
 * @param {Record<string, string>} [params.query] - Query params (invitation, name, ticket, returnTo).
 * @returns {string} - The URL.
 */
export const getExternalLoginStartUrl = ({
  providerId,
  query = {},
}: {
  providerId: string
  query?: Record<string, string>
}): string => {
  const search = new URLSearchParams(query).toString()
  const path = `/auth/oidc/${encodeURIComponent(providerId)}`
  return search ? `${path}?${search}` : path
}

export const getProviderIconUrl = (providerId: string): string =>
  `/auth/providers/${encodeURIComponent(providerId)}/icon`

export const submitExternalLoginTwoFactorToken = async ({ twoFactorToken, appInfo }) => {
  const { data } = await axios.post('/auth/oidc/_2fa', { twoFactorToken, appInfo })
  return data
}

// ===== link and test (logged-in user)
export const fetchExternalLoginTicket = async ({ providerId, mode }: { providerId: string; mode: 'link' | 'test' }) => {
  const { data } = await axios.post(`/auth/oidc/${encodeURIComponent(providerId)}/ticket`, { mode })
  return data.ticket
}

export const fetchTestSignInResult = async () => {
  const { data } = await axios.get('/auth/oidc/_test-result')
  return data
}

// ===== sign-in methods of a user
export const fetchUserSignInMethods = async ({ userUuid }: { userUuid: string }) => {
  const { data } = await axios.get(`/api/user/${userUuid}/sign-in-methods`)
  return data
}

export const unlinkUserIdentity = async ({
  userUuid,
  identityId,
  allowLastMethod = false,
}: {
  userUuid: string
  identityId: string
  allowLastMethod?: boolean
}) => {
  await axios.delete(`/api/user/${userUuid}/sign-in-methods/${identityId}`, { params: { allowLastMethod } })
}

// ===== administration (system admins)
export const fetchAdminProviders = async () => {
  const { data } = await axios.get(adminPath)
  return data
}

export const fetchAdminProvider = async ({ id }: { id: string }) => {
  const { data } = await axios.get(`${adminPath}/${encodeURIComponent(id)}`)
  return data
}

export const createProvider = async ({ id, type, props, clientSecret }) => {
  const { data } = await axios.post(adminPath, { id, type, props, clientSecret })
  return data
}

export const updateProvider = async ({ id, props, clientSecret }) => {
  const { data } = await axios.put(`${adminPath}/${encodeURIComponent(id)}`, { props, clientSecret })
  return data
}

export const reorderProviders = async ({ ids }: { ids: string[] }) => {
  await axios.put(`${adminPath}/order`, { ids })
}

export const deleteProvider = async ({ id, notifyUsers }: { id: string; notifyUsers: boolean }) => {
  const { data } = await axios.delete(`${adminPath}/${encodeURIComponent(id)}`, { params: { notifyUsers } })
  return data
}

export const fetchUsersWithoutOtherSignInMethod = async ({ id }: { id: string }) => {
  const { data } = await axios.get(`${adminPath}/${encodeURIComponent(id)}/users-without-other-method`)
  return data
}

export const testProviderConnection = async ({ id }: { id: string }) => {
  const { data } = await axios.post(`${adminPath}/${encodeURIComponent(id)}/test`)
  return data
}

export const uploadProviderIcon = async ({ id, file }: { id: string; file: File | null }) => {
  const formData = new FormData()
  if (file) formData.append('file', file)
  await axios.put(`${adminPath}/${encodeURIComponent(id)}/icon`, formData)
}
