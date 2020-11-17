import React from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'

const NodeDefLabelSwitch = ({ onChange, displayType }) => {
  const i18n = useI18n()

  return (
    <button type="button" onClick={onChange}>
      {i18n.t(
        `displayBy.${
          displayType === NodeDef.NodeDefLabelTypes.label
            ? NodeDef.NodeDefLabelTypes.name
            : NodeDef.NodeDefLabelTypes.label
        }`
      )}
    </button>
  )
}

NodeDefLabelSwitch.propTypes = {
  onChange: PropTypes.func,
  displayType: PropTypes.func,
}

NodeDefLabelSwitch.defaultProps = {
  onChange: () => {},
  displayType: NodeDef.NodeDefLabelTypes.label,
}

export default NodeDefLabelSwitch
