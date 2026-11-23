import { useState } from 'react'

import * as NodeDef from '@core/survey/nodeDef'

import { Button } from '@webapp/components/buttons'

export const useNodeDefLabelSwitch = () => {
  const [nodeDefLabelType, setNodeDefLabelType] = useState<NodeDef.NodeDefLabelType>(NodeDef.NodeDefLabelTypes.label)
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

type NodeDefLabelSwitchProps = {
  className?: string
  labelType: string
  allowedLabelTypes?: any[]
  onChange: (...args: any[]) => any
}

const NodeDefLabelSwitch = (props: NodeDefLabelSwitchProps) => {
  const {
    allowedLabelTypes = [NodeDef.NodeDefLabelTypes.label, NodeDef.NodeDefLabelTypes.name],
    className,
    onChange,
    labelType,
  } = props

  const allowedTypeValues = Object.values(allowedLabelTypes)
  const labelTypeNext = allowedTypeValues[(allowedTypeValues.indexOf(labelType) + 1) % allowedTypeValues.length]
  const label = buttonLabelKeysByType[labelTypeNext]

  return <Button className={className} onClick={onChange} label={label} size="small" variant="text" />
}

export default NodeDefLabelSwitch
