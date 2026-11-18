import './SignInMethodsPanel.scss'

import { useCallback, useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router'

import { Button, Fieldset } from '@webapp/components'
import { AuthProviderIcon } from '@webapp/components/authProvider/AuthProviderIcon'
import { useConfirm, useNotifyError, useNotifyInfo } from '@webapp/components/hooks'
import {
  fetchExternalLoginTicket,
  fetchLoginProviders,
  fetchUserSignInMethods,
  getExternalLoginStartUrl,
  unlinkUserIdentity,
} from '@webapp/service/api/authProviders'
import { useI18n } from '@webapp/store/system'
import { LoginActions } from '@webapp/store/login'

interface LinkedIdentity {
  id: string
  providerId: string
  providerLabel: string
  providerType?: string
  iconKind?: string
  email?: string
  dateLastUsed?: string
}

interface SignInMethods {
  hasPassword: boolean
  identities: LinkedIdentity[]
}

interface LoginProvider {
  id: string
  type: string
  label: string
  iconKind: string
}

type Props = {
  userUuid: string
  // own profile: providers can be linked (the sign-in happens in the browser of the user)
  editingLoggedInUser: boolean
  // system admin editing another user: can remove the last sign-in method after confirmation
  systemAdmin: boolean
  onSetPasswordClick: () => void
}

const formatDate = (date?: string): string | null => (date ? new Date(date).toLocaleDateString() : null)

// notifies the result of a link started from this page (redirect back from the provider)
const useLinkRedirectResult = (onLinked: () => void) => {
  const notifyInfo = useNotifyInfo()
  const notifyError = useNotifyError()
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const linkedProviderId = searchParams.get('externalLoginLinked')
    const errorKey = searchParams.get('externalLoginError')
    if (!linkedProviderId && !errorKey) return
    if (linkedProviderId) {
      notifyInfo({ key: 'usersView:signInMethods.linked' })
      onLinked()
    } else {
      notifyError({ key: LoginActions.toExternalLoginErrorMessageKey(errorKey) })
    }
    setSearchParams({}, { replace: true })
  }, [notifyError, notifyInfo, onLinked, searchParams, setSearchParams])
}

const IdentityRow = (props: {
  identity: LinkedIdentity
  canUnlink: boolean
  lastMethod: boolean
  onUnlink: (identity: LinkedIdentity) => void
}) => {
  const { identity, canUnlink, lastMethod, onUnlink } = props
  const i18n = useI18n()
  const lastUsed = formatDate(identity.dateLastUsed)
  return (
    <div className="sign-in-methods__row" data-testid={`sign-in-method-${identity.providerId}`}>
      <AuthProviderIcon iconKind={identity.iconKind} providerId={identity.providerId} type={identity.providerType} />
      <div className="sign-in-methods__text">
        <span className="sign-in-methods__label">{identity.providerLabel}</span>
        <span className="sign-in-methods__details">
          {[identity.email, lastUsed ? i18n.t('usersView:signInMethods.lastUsed', { date: lastUsed }) : null]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </div>
      {canUnlink && (
        <Button
          className="btn-s"
          disabled={lastMethod}
          label="usersView:signInMethods.unlink"
          onClick={() => onUnlink(identity)}
          title={lastMethod ? 'usersView:signInMethods.lastMethodHint' : undefined}
          variant="outlined"
        />
      )}
    </div>
  )
}

/**
 * Sign-in methods of a user: password and linked external login providers, with link and unlink.
 */
export const SignInMethodsPanel = (props: Props) => {
  const { userUuid, editingLoggedInUser, systemAdmin, onSetPasswordClick } = props
  const i18n = useI18n()
  const notifyInfo = useNotifyInfo()
  const notifyError = useNotifyError()
  const confirm = useConfirm()
  const location = useLocation()
  const [methods, setMethods] = useState<SignInMethods | null>(null)
  const [providers, setProviders] = useState<LoginProvider[]>([])

  const reload = useCallback(async () => {
    setMethods(await fetchUserSignInMethods({ userUuid }))
  }, [userUuid])

  useEffect(() => {
    const load = async () => {
      await reload()
    }
    void load()
    if (editingLoggedInUser) {
      fetchLoginProviders()
        .then(setProviders)
        .catch(() => setProviders([]))
    }
  }, [editingLoggedInUser, reload])

  useLinkRedirectResult(reload)

  const unlink = useCallback(
    async (identity: LinkedIdentity, allowLastMethod: boolean) => {
      try {
        await unlinkUserIdentity({ userUuid, identityId: identity.id, allowLastMethod })
        notifyInfo({ key: 'usersView:signInMethods.unlinked' })
      } catch (error: any) {
        const key = String(error?.response?.data?.key ?? 'appErrors.authProvider.identityNotFound')
        notifyError({ key: key.replace(/^appErrors\./, 'appErrors:') })
      }
      await reload()
    },
    [notifyError, notifyInfo, reload, userUuid]
  )

  const onUnlink = useCallback(
    (identity: LinkedIdentity, lastMethod: boolean) =>
      confirm({
        key: lastMethod ? 'usersView:signInMethods.unlinkLastMethodConfirm' : 'usersView:signInMethods.unlinkConfirm',
        params: { provider: identity.providerLabel },
        onOk: () => unlink(identity, lastMethod),
        onCancel: undefined,
      }),
    [confirm, unlink]
  )

  const onLink = useCallback(
    async (provider: LoginProvider) => {
      const ticket = await fetchExternalLoginTicket({ providerId: provider.id, mode: 'link' })
      // full page navigation to the provider; it redirects back to this page
      globalThis.location.assign(
        getExternalLoginStartUrl({ providerId: provider.id, query: { ticket, returnTo: location.pathname } })
      )
    },
    [location.pathname]
  )

  if (!methods) return null

  const { hasPassword, identities } = methods
  const linkedProviderIds = new Set(identities.map((identity) => identity.providerId))
  const providersToLink = providers.filter((provider) => !linkedProviderIds.has(provider.id))
  const methodsCount = identities.length + (hasPassword ? 1 : 0)
  const canUnlink = editingLoggedInUser || systemAdmin

  return (
    <Fieldset className="sign-in-methods" legend="usersView:signInMethods.title">
      <div className="sign-in-methods__row">
        <span aria-hidden="true" className="icon icon-key sign-in-methods__password-icon" />
        <div className="sign-in-methods__text">
          <span className="sign-in-methods__label">{i18n.t('usersView:signInMethods.password')}</span>
          <span className="sign-in-methods__details">
            {i18n.t(hasPassword ? 'usersView:signInMethods.passwordSet' : 'usersView:signInMethods.passwordNotSet')}
          </span>
        </div>
        {!hasPassword && (editingLoggedInUser || systemAdmin) && (
          <Button
            className="btn-s"
            iconClassName="icon-pencil"
            label="usersView:signInMethods.setPassword"
            onClick={onSetPasswordClick}
            variant="outlined"
          />
        )}
      </div>
      {identities.map((identity) => {
        const lastMethod = methodsCount <= 1
        return (
          <IdentityRow
            key={identity.id}
            canUnlink={canUnlink}
            identity={identity}
            // a system admin can remove the last method after a confirmation ("forgot password" stays available)
            lastMethod={lastMethod && !systemAdmin}
            onUnlink={(item) => onUnlink(item, lastMethod)}
          />
        )
      })}
      {editingLoggedInUser && providersToLink.length > 0 && (
        <div className="sign-in-methods__link">
          {providersToLink.map((provider) => (
            <Button
              key={provider.id}
              className="btn-s"
              icon={<AuthProviderIcon iconKind={provider.iconKind} providerId={provider.id} type={provider.type} />}
              label="usersView:signInMethods.linkWith"
              labelParams={{ provider: provider.label }}
              onClick={() => onLink(provider)}
              testId={`link-provider-${provider.id}`}
              variant="outlined"
            />
          ))}
        </div>
      )}
    </Fieldset>
  )
}
