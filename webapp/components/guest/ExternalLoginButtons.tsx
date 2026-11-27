import { useEffect, useState } from 'react'
import classNames from 'classnames'

import { AuthProviderIcon } from '@webapp/components/authProvider/AuthProviderIcon'
import { fetchLoginProviders, getExternalLoginStartUrl } from '@webapp/service/api/authProviders'
import { useI18n } from '@webapp/store/system'

export interface LoginProvider {
  id: string
  type: string
  label: string
  iconKind: 'builtin' | 'uploaded' | 'generic'
}

type Props = {
  // label of the buttons: "Sign in with ..." (login) or "Continue with ..." (invitation)
  labelKey?: string
  // extra query params of the start URL (e.g. invitation and name)
  query?: Record<string, string>
  // shown above the buttons, only when there is at least one provider
  dividerLabelKey?: string
  // shown under the provider name in every button (e.g. "Registered users only")
  captionKey?: string
  // called before leaving the page for the provider: the sign-in does not start if it returns false
  onBeforeNavigate?: () => Promise<boolean>
}

/**
 * Fetches the external login providers configured by the system admins (none on error).
 */
export const useLoginProviders = (): LoginProvider[] => {
  const [providers, setProviders] = useState<LoginProvider[]>([])
  useEffect(() => {
    // the guest pages work without the providers: errors are ignored
    fetchLoginProviders()
      .then(setProviders)
      .catch(() => setProviders([]))
  }, [])
  return providers
}

type ExternalLoginButtonProps = {
  captionKey?: string
  className?: string
  labelKey: string
  onBeforeNavigate?: () => Promise<boolean>
  provider: LoginProvider
  query?: Record<string, string>
}

/**
 * Button (link) starting the sign-in with an external login provider.
 */
export const ExternalLoginButton = (props: ExternalLoginButtonProps) => {
  const { captionKey, className, labelKey, onBeforeNavigate, provider, query } = props
  const i18n = useI18n()
  return (
    <a
      className={classNames('guest-external-login__button', className)}
      data-testid={`external-login-${provider.id}`}
      href={getExternalLoginStartUrl({ providerId: provider.id, query })}
      onClick={
        onBeforeNavigate
          ? async (event) => {
              event.preventDefault()
              const href = event.currentTarget.href
              if (await onBeforeNavigate()) {
                globalThis.location.assign(href)
              }
            }
          : undefined
      }
    >
      <AuthProviderIcon iconKind={provider.iconKind} providerId={provider.id} type={provider.type} />
      <span className="guest-external-login__label">
        {i18n.t(labelKey, { provider: provider.label })}
        {captionKey && <span className="guest-external-login__caption">{i18n.t(captionKey)}</span>}
      </span>
    </a>
  )
}

/**
 * Buttons to sign in with the external login providers configured by the system admins (none if there are no providers).
 */
export const ExternalLoginButtons = (props: Props) => {
  const {
    labelKey = 'guest:externalLogin.signInWith',
    query,
    dividerLabelKey = 'guest:loginView.or',
    captionKey,
    onBeforeNavigate,
  } = props
  const i18n = useI18n()
  const providers = useLoginProviders()

  if (providers.length === 0) return null

  return (
    <>
      <div className="guest__divider">{i18n.t(dividerLabelKey)}</div>
      <div className="guest-external-login">
        {providers.map((provider) => (
          <ExternalLoginButton
            key={provider.id}
            captionKey={captionKey}
            labelKey={labelKey}
            onBeforeNavigate={onBeforeNavigate}
            provider={provider}
            query={query}
          />
        ))}
      </div>
    </>
  )
}
