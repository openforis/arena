import './warningBadge.scss'

import React from 'react'

import { useI18n } from '@webapp/store/system'

const WarningBadge = ({ show, label, showLabel, title, titleParams }) => {
  const i18n = useI18n()
  const titleText = title ? i18n.t(title, titleParams) : undefined

  return show ? (
    <div className="badge warning-badge" title={titleText}>
      <div className="badge__content">
        <span className="icon icon-warning icon-12px icon-left" />
        {showLabel && <span>{label}</span>}
      </div>
    </div>
  ) : null
}

WarningBadge.defaultProps = {
  show: true,
  label: null,
  showLabel: true,
  title: undefined,
  titleParams: undefined,
}

export default WarningBadge
