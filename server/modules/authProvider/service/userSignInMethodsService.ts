import * as User from '@core/user/user'
import * as Log from '@server/log/log'
import * as UserManager from '@server/modules/user/manager/userManager'
import * as Mailer from '@server/utils/mailer'

import { getAuthProviderService } from './authProviderAdminService'

const logger = Log.getLogger('UserSignInMethodsService')

/**
 * Sign-in methods of a user: whether a password is set and the linked external providers.
 */
export const fetchSignInMethods = async ({ userUuid }: { userUuid: string }) => {
  const service = getAuthProviderService()
  const [userWithPassword, identities, providers] = await Promise.all([
    UserManager.fetchUserByUuidWithPassword(userUuid),
    service.getUserIdentities(userUuid),
    service.getAll(),
  ])
  const providersById = Object.fromEntries(providers.map((provider) => [provider.id, provider]))
  return {
    hasPassword: Boolean(User.getPassword(userWithPassword)),
    identities: identities.map((identity) => {
      const provider = providersById[identity.providerId]
      return {
        id: identity.id,
        providerId: identity.providerId,
        providerLabel: provider?.label ?? identity.providerId,
        providerType: provider?.type,
        iconKind: provider?.iconKind,
        email: identity.email,
        dateCreated: identity.dateCreated,
        dateLastUsed: identity.dateLastUsed,
      }
    }),
  }
}

/**
 * Removes a linked provider and notifies the user by email.
 */
export const unlinkIdentity = async ({
  userUuid,
  identityId,
  allowLastMethod,
}: {
  userUuid: string
  identityId: string
  allowLastMethod: boolean
}) => {
  const service = getAuthProviderService()
  const identity = await service.unlinkUserIdentity({ userUuid, identityId, allowLastMethod })
  const [user, provider] = await Promise.all([UserManager.fetchUserByUuid(userUuid), service.get(identity.providerId)])
  try {
    await Mailer.sendEmail({
      to: User.getEmail(user),
      msgKey: 'emails:authProviderUnlinked',
      msgParams: { name: User.getName(user), providerLabel: provider?.label ?? identity.providerId },
    })
  } catch (error) {
    logger.error(`error sending the unlink notification to user ${userUuid}: ${error.message}`)
  }
  return identity
}
