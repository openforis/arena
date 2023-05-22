import React, { useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'

import { useI18n } from '@webapp/store/system'
import { FormItem } from '@webapp/components/form/Input'

import * as NodeDef from '@core/survey/nodeDef'
import ButtonGroup from '@webapp/components/form/buttonGroup'

import { State } from './store'

const textInputTypes = ({ i18n }) =>
  Object.keys(NodeDef.textInputTypes).map((key) => ({
    key,
    label: i18n.t(`nodeDefEdit.textProps.textInputTypes.${key}`),
  }))

const textTransformTypes = ({ i18n }) =>
  Object.keys(NodeDef.textTransformValues).map((labelKey) => ({
    key: labelKey,
    label: i18n.t(`nodeDefEdit.textProps.textTransformTypes.${labelKey}`),
  }))

const TextProps = (props) => {
  const { state, Actions } = props

  const i18n = useI18n()

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
      <FormItem label={i18n.t('nodeDefEdit.textProps.textTransform')}>
        <ButtonGroup
          selectedItemKey={NodeDef.getTextTransform(nodeDef)}
          onChange={selectLabelValue}
          items={textTransformTypes({ i18n })}
        />
      </FormItem>
      <FormItem label={i18n.t('nodeDefEdit.textProps.textInputType')}>
        <ButtonGroup
          selectedItemKey={NodeDef.getTextInputType(nodeDef)}
          onChange={(value) => {
            Actions.setProp({ state, key: NodeDef.propKeys.textInputType, value })
          }}
          items={textInputTypes({ i18n })}
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
