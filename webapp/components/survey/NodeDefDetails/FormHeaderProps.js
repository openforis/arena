import './FormHeaderProps.scss'

import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'
import { FormItem } from '@webapp/components/form/Input'
import ButtonGroup, { toButtonGroupItems } from '@webapp/components/form/buttonGroup'

import { headerColors, headerColorCodesByColor } from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'

import { State } from './store'

const headerColorItems = ({ i18n }) =>
  toButtonGroupItems({
    i18n,
    object: headerColors,
    labelPrefix: 'nodeDefEdit.formHeaderProps.headerColor.',
    icon: ({ key }) => (
      <span className="form-header-color-icon" style={{ backgroundColor: headerColorCodesByColor[key] }} />
    ),
  })

const FormHeaderProps = (props) => {
  const { state, Actions } = props

  const i18n = useI18n()

  const nodeDef = State.getNodeDef(state)

  const headerColor = NodeDef.getHeaderColor(nodeDef)
  const selectedHeaderColorKey = Object.keys(headerColors).find((key) => headerColors[key] === headerColor)

  const onHeaderColorChange = useCallback(
    (value) => {
      Actions.setProp({ state, key: NodeDef.propKeys.headerColor, value: headerColors[value] })
    },
    [Actions, state]
  )

  return (
    <FormItem label={i18n.t('nodeDefEdit.formHeaderProps.headerColorLabel')}>
      <ButtonGroup
        className="form-header-color-btn-group"
        selectedItemKey={selectedHeaderColorKey}
        onChange={onHeaderColorChange}
        items={headerColorItems({ i18n })}
      />
    </FormItem>
  )
}

FormHeaderProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default FormHeaderProps
