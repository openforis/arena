import React, { useState } from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import { Button } from '@webapp/components/buttons'

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

const buttonLabelKeysByType = {
  [NodeDef.NodeDefLabelTypes.label]: 'common.showLabels',
  [NodeDef.NodeDefLabelTypes.name]: 'common.showNames',
  [NodeDef.NodeDefLabelTypes.labelAndName]: 'common.showLabelsAndNames',
}

const NodeDefLabelSwitch = (props) => {
  const { allowedLabelTypes, className, onChange, labelType } = props

  const allowedTypeValues = Object.values(allowedLabelTypes)
  const labelTypeNext = allowedTypeValues[(allowedTypeValues.indexOf(labelType) + 1) % allowedTypeValues.length]
  const label = buttonLabelKeysByType[labelTypeNext]

  return <Button className={className} onClick={onChange} label={label} variant="text" />
}

NodeDefLabelSwitch.propTypes = {
  className: PropTypes.string,
  labelType: PropTypes.string.isRequired,
  allowedLabelTypes: PropTypes.array,
  onChange: PropTypes.func.isRequired,
}

NodeDefLabelSwitch.defaultProps = {
  allowedLabelTypes: [NodeDef.NodeDefLabelTypes.label, NodeDef.NodeDefLabelTypes.name],
  className: '',
}

export default NodeDefLabelSwitch
