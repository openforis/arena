import React from 'react'

import { getNodeValue } from '../../../../../common/record/node'

import { nodeDefRenderType } from '../../../../../common/survey/nodeDefLayout'

import NodeDefFormItem from './nodeDefFormItem'

const Button = ({nodeDef, parentNode, nodes, updateNode, label, disabled, value, entry}) => {
  const node = entry ? nodes[0] : null

  const nodeValue = getNodeValue(node, '')

  return (
    <button className="btn btn-s btn-transparent"
            style={{borderRadius: '.75rem'}}
            aria-disabled={disabled}
            onClick={() => updateNode(nodeDef, node, value)}>
      <span className={`icon icon-radio-${nodeValue === value ? 'checked2' : 'unchecked'} icon-left`}/>
      {label}
    </button>
  )

}

const Buttons = props =>
  <div style={{borderBottom: 'none', textAlign: 'center'}}>

    <Button {...props}
            disabled={props.edit}
            label="TRUE"
            value="true"/>

    <Button {...props}
            disabled={props.edit}
            label="FALSE"
            value="false"/>

  </div>

const NodeDefBoolean = props => {
  const {renderType, label} = props

  if (renderType === nodeDefRenderType.tableHeader) {

    return <label className="node-def__table-header">
      {label}
    </label>

  } else if (renderType === nodeDefRenderType.tableBody) {

    return <Buttons {...props}/>

  } else {

    return <NodeDefFormItem {...props}>
      <Buttons {...props}/>
    </NodeDefFormItem>

  }

}

export default NodeDefBoolean
