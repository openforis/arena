import React, { useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

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

const buttonLabelKeysByType = {
  [NodeDef.NodeDefLabelTypes.label]: 'common.showLabels',
  [NodeDef.NodeDefLabelTypes.name]: 'common.showNames',
  [NodeDef.NodeDefLabelTypes.labelAndName]: 'common.showLabelsAndNames',
}

const NodeDefLabelSwitch = (props) => {
  const { allowedLabelTypes, className, onChange, labelType } = props
  const i18n = useI18n()

  const allowedTypeValues = Object.values(allowedLabelTypes)
  const labelTypeNext = allowedTypeValues[(allowedTypeValues.indexOf(labelType) + 1) % allowedTypeValues.length]
  const label = buttonLabelKeysByType[labelTypeNext]

  return (
    <button type="button" className={classNames('btn-transparent', className)} onClick={onChange}>
      {i18n.t(label)}
    </button>
  )
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
