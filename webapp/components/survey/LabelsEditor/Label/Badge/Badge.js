import React from 'react'
import PropTypes from 'prop-types'

import { getLanguageLabel } from '@core/app/languages'

const Badge = ({ lang = '', compact = false }) => (
  <div className="badge-of labels-editor__badge" title={compact ? getLanguageLabel(lang) : null}>
    {compact ? lang : getLanguageLabel(lang)}
  </div>
)

Badge.propTypes = {
  lang: PropTypes.string,
  compact: PropTypes.bool,
}

export default Badge
