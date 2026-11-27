import { Link } from 'react-router'

import { appModuleUri, guestModules } from '@webapp/app/appModules'
import { AppIcon, IconName } from '@webapp/components/AppIcon'
import { useI18nT } from '@webapp/store/system'

type Props = {
  backToLogin?: boolean
  description?: string
  descriptionParams?: Record<string, unknown>
  icon?: IconName
  iconVariant?: 'primary' | 'success'
  onBackClick?: () => void
  title: string
}

/**
 * Header of a guest view: optional "back to login" link and icon, title and description.
 *
 * @returns {React.ReactElement} The header element.
 */
export const GuestViewHeader = (props: Props) => {
  const {
    backToLogin = false,
    description,
    descriptionParams,
    icon,
    iconVariant = 'primary',
    onBackClick,
    title,
  } = props
  const t = useI18nT()
  return (
    <div className="guest__view-header">
      {backToLogin && (
        <Link className="guest__back-link" to={appModuleUri(guestModules.login)} onClick={onBackClick}>
          <AppIcon name="arrowBack" size={14} />
          {t('guest:loginView.backToLogin')}
        </Link>
      )}
      {icon && (
        <div className={`guest__view-icon guest__view-icon--${iconVariant}`}>
          <AppIcon name={icon} size={20} />
        </div>
      )}
      <h2 className="guest__view-title">{t(title)}</h2>
      {description && <p className="guest__view-description">{t(description, descriptionParams)}</p>}
    </div>
  )
}
