import React from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'

const NodeDefLabelSwitch = ({ onChange, labelType }) => {
  const i18n = useI18n()

  return (
    <button type="button" onClick={onChange}>
      {i18n.t(
        `displayBy.${
          labelType === NodeDef.NodeDefLabelTypes.label
            ? NodeDef.NodeDefLabelTypes.name
            : NodeDef.NodeDefLabelTypes.label
        }`
      )}
    </button>
  )
}

NodeDefLabelSwitch.propTypes = {
  onChange: PropTypes.func,
  labelType: PropTypes.func,
}

NodeDefLabelSwitch.defaultProps = {
  onChange: () => {},
  labelType: NodeDef.NodeDefLabelTypes.label,
}

export default NodeDefLabelSwitch
