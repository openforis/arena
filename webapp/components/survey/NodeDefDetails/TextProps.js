import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { useSurveyCycleKey } from '@webapp/store/survey'

import { FormItem } from '@webapp/components/form/Input'
import ButtonGroup from '@webapp/components/form/buttonGroup'

import { State } from './store'

const textInputTypes = Object.keys(NodeDef.textInputTypes).map((key) => ({
  key,
  label: `nodeDefEdit.textProps.textInputTypes.${key}`,
}))

const textTransformTypes = Object.keys(NodeDef.textTransformValues).map((key) => ({
  key,
  label: `nodeDefEdit.textProps.textTransformTypes.${key}`,
}))

const displayAsItems = Object.keys(NodeDefLayout.textRenderType).map((key) => ({
  key,
  label: `nodeDefEdit.textProps.displayAsTypes.${key}`,
}))

const TextProps = (props) => {
  const { state, Actions } = props

  const surveyCycleKey = useSurveyCycleKey()

  const nodeDef = State.getNodeDef(state)

  const onLabelValueChange = useCallback(
    (value) => {
      Actions.setProp({ state, key: NodeDef.propKeys.textTransform, value })
    },
    [Actions, state]
  )

  const onInputTypeChange = useCallback(
    (value) => {
      Actions.setProp({ state, key: NodeDef.propKeys.textInputType, value })
    },
    [Actions, state]
  )

  return (
    <>
      <FormItem label="nodeDefEdit.textProps.textTransform">
        <ButtonGroup
          selectedItemKey={NodeDef.getTextTransform(nodeDef)}
          onChange={onLabelValueChange}
          items={textTransformTypes}
        />
      </FormItem>
      <FormItem label="nodeDefEdit.textProps.textInputType">
        <ButtonGroup
          selectedItemKey={NodeDef.getTextInputType(nodeDef)}
          onChange={onInputTypeChange}
          items={textInputTypes}
        />
      </FormItem>
      {NodeDef.isReadOnly(nodeDef) && (
        <FormItem label="nodeDefEdit.basicProps.displayAs">
          <ButtonGroup
            selectedItemKey={NodeDefLayout.getRenderType(surveyCycleKey)(nodeDef)}
            onChange={(value) => Actions.setLayoutProp({ state, key: NodeDefLayout.keys.renderType, value })}
            items={displayAsItems}
          />
        </FormItem>
      )}
    </>
  )
}

TextProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default TextProps
