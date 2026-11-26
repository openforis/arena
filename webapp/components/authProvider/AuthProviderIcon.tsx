import './AuthProviderIcon.scss'

import { AppIcon } from '@webapp/components/AppIcon'
import { getProviderIconUrl } from '@webapp/service/api/authProviders'

const builtinIconByType: Record<string, string> = {
  google: '/img/auth-providers/google.svg',
  microsoft: '/img/auth-providers/microsoft.svg',
}

type Props = {
  providerId: string
  type?: string
  iconKind?: string
  // forces a new request after an upload (the icon URL does not change)
  iconVersion?: string | number
}

/**
 * Icon of an external login provider: official logo of the presets, uploaded icon or generic icon.
 */
export const AuthProviderIcon = ({ providerId, type, iconKind, iconVersion }: Props) => {
  if (iconKind === 'builtin' && type && builtinIconByType[type]) {
    return <img alt="" aria-hidden="true" className="auth-provider-icon" src={builtinIconByType[type]} />
  }
  if (iconKind === 'uploaded') {
    const versionQuery = iconVersion ? `?v=${iconVersion}` : ''
    const src = getProviderIconUrl(providerId) + versionQuery
    return <img alt="" aria-hidden="true" className="auth-provider-icon" src={src} />
  }
  return <AppIcon className="auth-provider-icon--generic" name="login" size={20} />
}
