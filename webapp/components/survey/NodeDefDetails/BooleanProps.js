import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import { FormItem } from '@webapp/components/form/Input'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import ButtonGroup from '@webapp/components/form/buttonGroup'
import { useSurveyCycleKey } from '@webapp/store/survey'
import { State } from './store'

const displayAsItems = ({ i18n }) => [
  {
    key: NodeDefLayout.renderType.checkbox,
    label: i18n.t('nodeDefEdit.codeProps.displayAsTypes.checkbox'),
  },
  {
    key: NodeDefLayout.renderType.dropdown,
    label: i18n.t('nodeDefEdit.codeProps.displayAsTypes.dropdown'),
  },
]

const BooleanProps = (props) => {
  const { state, Actions } = props

  const surveyCycleKey = useSurveyCycleKey()
  const i18n = useI18n()

  const nodeDef = State.getNodeDef(state)

  return (
    <FormItem label={i18n.t('nodeDefEdit.codeProps.displayAs')}>
      <ButtonGroup
        selectedItemKey={NodeDefLayout.getRenderType(surveyCycleKey)(nodeDef)}
        onChange={(value) => Actions.setLayoutProp({ state, key: NodeDefLayout.keys.renderType, value })}
        items={displayAsItems({ i18n })}
      />
    </FormItem>
  )
}

BooleanProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default BooleanProps
