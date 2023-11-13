import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'
import { FormItem } from '@webapp/components/form/Input'
import ButtonGroup from '@webapp/components/form/buttonGroup'

import { headerColors } from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'

import { State } from './store'

const toButtonGroupItems = ({ i18n, object, labelPrefix }) =>
  Object.keys(object).map((key) => ({
    key,
    label: i18n.t(`${labelPrefix}${key}`),
  }))

const headerColorItems = ({ i18n }) =>
  toButtonGroupItems({ i18n, object: headerColors, labelPrefix: 'nodeDefEdit.textProps.headerColor.' })

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

  const headerColor = NodeDef.getHeaderColor(nodeDef)
  const selectedHeaderColorKey = Object.keys(headerColors).find((key) => headerColors[key] === headerColor)

  const onHeaderColorChange = useCallback(
    (value) => {
      Actions.setProp({ state, key: NodeDef.propKeys.headerColor, value: headerColors[value] })
    },
    [Actions, state]
  )

  return (
    <>
      {NodeDef.isFormHeader(nodeDef) ? (
        <>
          <FormItem label={i18n.t('nodeDefEdit.textProps.headerColorLabel')}>
            <ButtonGroup
              selectedItemKey={selectedHeaderColorKey}
              onChange={onHeaderColorChange}
              items={headerColorItems({ i18n })}
            />
          </FormItem>
        </>
      ) : (
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
      )}
    </>
  )
}

TextProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default TextProps
