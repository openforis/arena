import './WarningBadge.scss'

import { AppIcon } from '@webapp/components/AppIcon'
import { useI18nT } from '@webapp/store/system'

const WarningBadge = ({ label = null, show = true, showLabel = true, title = undefined, titleParams = undefined }) => {
  const t = useI18nT()
  const titleText = title ? t(title, titleParams) : undefined

  return show ? (
    <div className="badge warning-badge" title={titleText}>
      <div className="badge__content">
        <AppIcon name="warning" size={14} className="icon-left" />
        {showLabel && <span>{label}</span>}
      </div>
    </div>
  ) : null
}

export default WarningBadge
