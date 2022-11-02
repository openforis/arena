import React, { useState } from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'

export const useNodeDefLabelSwitch = () => {
  const [nodeDefLabelType, setNodeDefLabelType] = useState(NodeDef.NodeDefLabelTypes.label)
  const toggleLabelFunction = () => {
    setNodeDefLabelType((nodeDefLabelTypeOld) =>
      nodeDefLabelTypeOld === NodeDef.NodeDefLabelTypes.label
        ? NodeDef.NodeDefLabelTypes.name
        : NodeDef.NodeDefLabelTypes.label
    )
  }

  return { nodeDefLabelType, toggleLabelFunction }
}

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
