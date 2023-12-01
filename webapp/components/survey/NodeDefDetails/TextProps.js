import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'
import { FormItem } from '@webapp/components/form/Input'
import ButtonGroup, { toButtonGroupItems } from '@webapp/components/form/buttonGroup'

import { State } from './store'

const textInputTypes = ({ i18n }) =>
  toButtonGroupItems({ i18n, object: NodeDef.textInputTypes, labelPrefix: 'nodeDefEdit.textProps.textInputTypes.' })

const textTransformTypes = ({ i18n }) =>
  toButtonGroupItems({
    i18n,
    object: NodeDef.textTransformValues,
    labelPrefix: 'nodeDefEdit.textProps.textTransformTypes.',
  })

const TextProps = (props) => {
  const { state, Actions } = props

  const i18n = useI18n()

  const nodeDef = State.getNodeDef(state)

  const onLabelValueChange = useCallback(
    (value) => {
      Actions.setProp({ state, key: NodeDef.propKeys.textTransform, value })
    },
    [Actions, state]
  )

  return (
    <>
      <FormItem label={i18n.t('nodeDefEdit.textProps.textTransform')}>
        <ButtonGroup
          selectedItemKey={NodeDef.getTextTransform(nodeDef)}
          onChange={onLabelValueChange}
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
