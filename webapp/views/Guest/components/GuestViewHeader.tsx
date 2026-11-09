import { Link } from 'react-router'

import { appModuleUri, guestModules } from '@webapp/app/appModules'
import { useI18nT } from '@webapp/store/system'

type Props = {
  backToLogin?: boolean
  description?: string
  descriptionParams?: Record<string, unknown>
  icon?: string
  iconVariant?: 'primary' | 'success'
  onBackClick?: () => void
  title: string
}

/**
 * Header of a guest view: optional "back to login" link and icon, title and description.
 *
 * @param {Props} props - The props.
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
          <span className="icon icon-arrow-left2 icon-12px" />
          {t('guest:loginView.backToLogin')}
        </Link>
      )}
      {icon && (
        <div className={`guest__view-icon guest__view-icon--${iconVariant}`}>
          <span className={`icon ${icon} icon-20px`} />
        </div>
      )}
      <h2 className="guest__view-title">{t(title)}</h2>
      {description && <p className="guest__view-description">{t(description, descriptionParams)}</p>}
    </div>
  )
}
