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
    onQualifierFieldBlur = undefined,
    onQualifierFieldFocus = undefined,
    onQualifierFieldLockToggle = undefined,
    parentNode = null,
    qualifierFieldLocked = false,
    qualifierFieldLockVisible = false,
    ...otherProps
  } = props

  const onFieldFocus = (event) => {
    onKeyFieldFocus?.(event)
    onQualifierFieldFocus?.(event)
  }
  const onFieldBlur = (event) => {
    onKeyFieldBlur?.(event)
    onQualifierFieldBlur?.(event)
  }

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
          qualifierFieldLocked={qualifierFieldLocked}
          qualifierFieldLockVisible={qualifierFieldLockVisible}
          onQualifierFieldLockToggle={onQualifierFieldLockToggle}
        />
      }
      className="survey-form__node-def-form-item"
    >
      <fieldset
        aria-label={label}
        className="survey-form__node-def-fieldset survey-form__node-def-form-item-content"
        onFocus={onFieldFocus}
        onBlur={onFieldBlur}
      >
        {formItemContent}
      </fieldset>
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
  onQualifierFieldBlur: PropTypes.func,
  onQualifierFieldFocus: PropTypes.func,
  onQualifierFieldLockToggle: PropTypes.func,
  parentNode: PropTypes.object,
  qualifierFieldLocked: PropTypes.bool,
  qualifierFieldLockVisible: PropTypes.bool,
}

export default NodeDefFormItem
