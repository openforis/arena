import React from 'react'
import classNames from 'classnames'

import { FormItem } from '@webapp/components/form/Input'

import * as NodeDef from '@core/survey/nodeDef'

import * as NodeDefUiProps from '../../nodeDefUIProps'
import NodeDefFormItemLabel from './NodeDefFormItemLabel'
import type { ArenaAnyNodeDef, ArenaRecordNode } from '@openforis/arena-core'

type NodeDefFormItemProps = {
  edit: boolean
  entry: boolean
  label: string
  lang: string
  keyFieldLocked?: boolean
  keyFieldLockVisible?: boolean
  nodeDef: ArenaAnyNodeDef
  nodes?: any[]
  onKeyFieldBlur?: (...args: any[]) => any
  onKeyFieldFocus?: (...args: any[]) => any
  onKeyFieldLockToggle?: (...args: any[]) => any
  onQualifierFieldBlur?: (...args: any[]) => any
  onQualifierFieldFocus?: (...args: any[]) => any
  onQualifierFieldLockToggle?: (...args: any[]) => any
  parentNode?: ArenaRecordNode
  qualifierFieldLocked?: boolean
  qualifierFieldLockVisible?: boolean
}

const NodeDefFormItem = (props: NodeDefFormItemProps) => {
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

export default NodeDefFormItem
