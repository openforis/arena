import { useEffect, useState } from 'react'

import { AuthProviderIcon } from '@webapp/components/authProvider/AuthProviderIcon'
import { fetchLoginProviders, getExternalLoginStartUrl } from '@webapp/service/api/authProviders'
import { useI18n } from '@webapp/store/system'

interface LoginProvider {
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
  const [providers, setProviders] = useState<LoginProvider[]>([])

  useEffect(() => {
    // the login page works without the providers: errors are ignored
    fetchLoginProviders()
      .then(setProviders)
      .catch(() => setProviders([]))
  }, [])

  if (providers.length === 0) return null

  return (
    <>
      <div className="guest__divider">{i18n.t(dividerLabelKey)}</div>
      <div className="guest-external-login">
        {providers.map((provider) => (
          <a
            key={provider.id}
            className="guest-external-login__button"
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
        ))}
      </div>
    </>
  )
}
