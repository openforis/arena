import React from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'

const NodeDefLabelSwitch = (props) => {
  const { className, onChange, labelType } = props
  const i18n = useI18n()

  const label = labelType === NodeDef.NodeDefLabelTypes.label ? 'common.showNames' : 'common.showLabels'

  return (
    <button type="button" className={className} onClick={onChange}>
      {i18n.t(label)}
    </button>
  )
}

NodeDefLabelSwitch.propTypes = {
  className: PropTypes.string,
  labelType: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
}

NodeDefLabelSwitch.defaultProps = {
  className: '',
}

export default NodeDefLabelSwitch
