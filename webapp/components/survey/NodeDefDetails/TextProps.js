import React, { useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'

import { FormItem } from '@webapp/components/form/Input'

import * as NodeDef from '@core/survey/nodeDef'
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

const TextProps = (props) => {
  const { state, Actions } = props

  const nodeDef = State.getNodeDef(state)

  const selectLabelValue = useCallback(
    (value) => {
      Actions.setProp({ state, key: NodeDef.propKeys.textTransform, value })
    },
    [state]
  )

  useEffect(() => {
    if (A.isEmpty(NodeDef.getTextTransform(nodeDef))) {
      selectLabelValue(NodeDef.textTransformValues.none)
    }
  }, [])

  return (
    <>
      <FormItem label="nodeDefEdit.textProps.textTransform">
        <ButtonGroup
          selectedItemKey={NodeDef.getTextTransform(nodeDef)}
          onChange={selectLabelValue}
          items={textTransformTypes}
        />
      </FormItem>
      <FormItem label="nodeDefEdit.textProps.textInputType">
        <ButtonGroup
          selectedItemKey={NodeDef.getTextInputType(nodeDef)}
          onChange={(value) => {
            Actions.setProp({ state, key: NodeDef.propKeys.textInputType, value })
          }}
          items={textInputTypes}
        />
      </FormItem>
    </>
  )
}

TextProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default TextProps
