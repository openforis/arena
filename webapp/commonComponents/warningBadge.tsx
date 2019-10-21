import './warningBadge.scss'

import React from 'react'

const WarningBadge = ({show, label, showLabel}) => {

  return show
    ? (
      <div className="badge warning-badge">
        <div className="badge__content">
          <span className="icon icon-warning icon-12px icon-left"/>
          {
            showLabel &&
            <span>{label}</span>
          }
        </div>
      </div>
    )
    : null
}

WarningBadge.defaultProps = {
  show: true,
  label: null,
  showLabel: true,
}

export default WarningBadge
