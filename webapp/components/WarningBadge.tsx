import './WarningBadge.scss'

import { useI18nT } from '@webapp/store/system'

const WarningBadge = ({ label = null, show = true, showLabel = true, title = undefined, titleParams = undefined }) => {
  const t = useI18nT()
  const titleText = title ? t(title, titleParams) : undefined

  return show ? (
    <div className="badge warning-badge" title={titleText}>
      <div className="badge__content">
        <span className="icon icon-warning icon-12px icon-left" />
        {showLabel && <span>{label}</span>}
      </div>
    </div>
  ) : null
}

export default WarningBadge
