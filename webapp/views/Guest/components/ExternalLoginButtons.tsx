import { useEffect, useState } from 'react'

import { useI18n } from '@webapp/store/system'
import { AuthProviderIcon } from '@webapp/components/authProvider/AuthProviderIcon'
import { fetchLoginProviders, getExternalLoginStartUrl } from '@webapp/service/api/authProviders'

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
}

/**
 * Buttons to sign in with the external login providers configured by the system admins (none if there are no providers).
 */
export const ExternalLoginButtons = (props: Props) => {
  const { labelKey = 'guest:externalLogin.signInWith', query, dividerLabelKey = 'guest:loginView.or' } = props
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
          >
            <AuthProviderIcon iconKind={provider.iconKind} providerId={provider.id} type={provider.type} />
            <span>{i18n.t(labelKey, { provider: provider.label })}</span>
          </a>
        ))}
      </div>
    </>
  )
}
