import './FormHeaderProps.scss'

import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'

import { FormHeaderColor } from '@openforis/arena-core'

import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'
import { FormItem } from '@webapp/components/form/Input'
import ButtonGroup, { toButtonGroupItems } from '@webapp/components/form/buttonGroup'

import { headerColorRgbCodesByColor } from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'

import { State } from './store'

const headerColorItems = ({ i18n }) =>
  toButtonGroupItems({
    i18n,
    object: FormHeaderColor,
    labelPrefix: 'nodeDefEdit.formHeaderProps.headerColor.',
    icon: ({ key }) => (
      <span className="form-header-color-icon" style={{ backgroundColor: headerColorRgbCodesByColor[key] }} />
    ),
  })

const FormHeaderProps = (props) => {
  const { state, Actions } = props

  const i18n = useI18n()

  const nodeDef = State.getNodeDef(state)

  const headerColor = NodeDef.getHeaderColor(nodeDef)

  const onHeaderColorChange = useCallback(
    (value) => {
      Actions.setProp({ state, key: NodeDef.propKeys.headerColor, value: FormHeaderColor[value] })
    },
    [Actions, state]
  )

  const items = useMemo(() => headerColorItems({ i18n }), [i18n])

  return (
    <FormItem label={i18n.t('nodeDefEdit.formHeaderProps.headerColorLabel')}>
      <ButtonGroup
        className="form-header-color-btn-group"
        selectedItemKey={headerColor}
        onChange={onHeaderColorChange}
        items={items}
      />
    </FormItem>
  )
}

FormHeaderProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default FormHeaderProps
