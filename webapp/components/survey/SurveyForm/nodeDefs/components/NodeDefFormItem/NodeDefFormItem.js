import React from 'react'
import PropTypes from 'prop-types'

import { FormItem } from '@webapp/components/form/Input'

import * as NodeDef from '@core/survey/nodeDef'

import * as NodeDefUiProps from '../../nodeDefUIProps'
import NodeDefFormItemLabel from './NodeDefFormItemLabel'

const NodeDefFormItem = (props) => {
  const { edit, entry, label, nodeDef, nodes, parentNode } = props

  const nodeDefComponent = React.createElement(NodeDefUiProps.getComponent(nodeDef), { ...props })

  return NodeDef.isEntity(nodeDef) ? (
    nodeDefComponent
  ) : (
    <FormItem
      label={<NodeDefFormItemLabel nodeDef={nodeDef} label={label} edit={edit} nodes={nodes} parentNode={parentNode} />}
      className="survey-form__node-def-form-item"
    >
      <div className={`${entry && NodeDef.isMultiple(nodeDef) ? 'survey-form__node-def-multiple-container' : ''}`}>
        {nodeDefComponent}
      </div>
    </FormItem>
  )
}

NodeDefFormItem.propTypes = {
  edit: PropTypes.bool.isRequired,
  entry: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  nodeDef: PropTypes.object.isRequired,
  nodes: PropTypes.array,
  parentNode: PropTypes.object,
}

NodeDefFormItem.defaultProps = {
  nodes: [],
  parentNode: null,
}

export default NodeDefFormItem
