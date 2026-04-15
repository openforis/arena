import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'

import { FormItem } from '@webapp/components/form/Input'

import * as NodeDef from '@core/survey/nodeDef'

import * as NodeDefUiProps from '../../nodeDefUIProps'
import NodeDefFormItemLabel from './NodeDefFormItemLabel'

const NodeDefFormItem = (props) => {
  const {
    edit,
    entry,
    keyFieldLocked = false,
    keyFieldLockVisible = false,
    label,
    lang,
    nodeDef,
    nodes = [],
    onKeyFieldBlur = undefined,
    onKeyFieldFocus = undefined,
    onKeyFieldLockToggle = undefined,
    parentNode = null,
    ...otherProps
  } = props

  const nodeDefComponent = React.createElement(NodeDefUiProps.getComponent(nodeDef), {
    edit,
    entry,
    label,
    lang,
    nodeDef,
    nodes,
    parentNode,
    ...otherProps,
  })

  if (NodeDef.isEntity(nodeDef) || NodeDef.isFormHeader(nodeDef)) {
    return nodeDefComponent
  }

  const autoResize = NodeDef.isCode(nodeDef)
  const containerClassName = classNames('survey-form__node-def-multiple-container', { 'auto-resize': autoResize })

  const formItemContent =
    entry && NodeDef.isMultiple(nodeDef) ? (
      <div className={containerClassName}>{nodeDefComponent}</div>
    ) : (
      nodeDefComponent
    )

  return (
    <FormItem
      label={
        <NodeDefFormItemLabel
          nodeDef={nodeDef}
          label={label}
          lang={lang}
          edit={edit}
          nodes={nodes}
          parentNode={parentNode}
          keyFieldLocked={keyFieldLocked}
          keyFieldLockVisible={keyFieldLockVisible}
          onKeyFieldLockToggle={onKeyFieldLockToggle}
        />
      }
      className="survey-form__node-def-form-item"
    >
      <div className="survey-form__node-def-form-item-content" onFocus={onKeyFieldFocus} onBlur={onKeyFieldBlur}>
        {formItemContent}
      </div>
    </FormItem>
  )
}

NodeDefFormItem.propTypes = {
  edit: PropTypes.bool.isRequired,
  entry: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  lang: PropTypes.string.isRequired,
  keyFieldLocked: PropTypes.bool,
  keyFieldLockVisible: PropTypes.bool,
  nodeDef: PropTypes.object.isRequired,
  nodes: PropTypes.array,
  onKeyFieldBlur: PropTypes.func,
  onKeyFieldFocus: PropTypes.func,
  onKeyFieldLockToggle: PropTypes.func,
  parentNode: PropTypes.object,
}

export default NodeDefFormItem
