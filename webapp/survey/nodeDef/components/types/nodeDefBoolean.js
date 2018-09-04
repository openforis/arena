import React from 'react'
import * as R from 'ramda'

import { getSurveyDefaultLanguage } from '../../../../../common/survey/survey'
import { getNodeDefLabel } from '../../../../../common/survey/nodeDef'

import { getNodeValue, newNodePlaceholder } from '../../../../../common/record/node'

import { nodeDefRenderType } from '../../../../../common/survey/nodeDefLayout'

import NodeDefFormItem from './nodeDefFormItem'

const Button = ({nodeDef, parentNode, nodes, updateNode, label, disabled, value, edit}) => {
  const node = edit
    ? null
    : R.isEmpty(nodes)
      ? newNodePlaceholder(nodeDef, parentNode)
      : nodes[0]

  const nodeValue = getNodeValue(node, 'false')

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

const NodeDefBoolean = props => {
  const {survey, edit, nodeDef, renderType} = props

  if (renderType === nodeDefRenderType.tableHeader) {
    const lang = getSurveyDefaultLanguage(survey)
    return <label className="node-def__table-header">{getNodeDefLabel(nodeDef, lang)}</label>
  }

  return (
    <NodeDefFormItem {...props}>
      <div className="form-input" style={{borderBottom: 'none'}}>

        <Button disabled={edit}
                label="YES"
                value="true"
                {...props}/>

        <Button disabled={edit}
                label="NO"
                value="false"
                {...props}/>

      </div>
    </NodeDefFormItem>
  )

}

export default NodeDefBoolean
