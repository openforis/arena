import React, { useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'
import * as NodeDef from '@core/survey/nodeDef'

import ButtonGroup from '@webapp/components/form/buttonGroup'
import { FormItem } from '@webapp/components/form/Input'
import { useI18n } from '@webapp/store/system'

import { State } from './store'

const booleanAnswerTypes = ({ i18n }) => [
  {
    key: NodeDef.booleanLabelValues.trueFalse,
    label: i18n.t('nodeDefEdit.booleanProps.labelValues.trueFalse'),
  },
  {
    key: NodeDef.booleanLabelValues.yesNo,
    label: i18n.t('nodeDefEdit.booleanProps.labelValues.yesNo'),
  },
]

const BooleanProps = (props) => {
  const { state, Actions } = props

  const i18n = useI18n()

  const nodeDef = State.getNodeDef(state)

  const selectLabelValue = useCallback(
    (value) => {
      Actions.setProp({ state, key: NodeDef.propKeys.labelValue, value })
    },
    [state]
  )

  useEffect(() => {
    if (A.isEmpty(NodeDef.getLabelValue(nodeDef))) {
      selectLabelValue(NodeDef.booleanLabelValues.trueFalse)
    }
  }, [])

  return (
    <FormItem label={i18n.t('nodeDefEdit.booleanProps.labelValue')}>
      <ButtonGroup
        selectedItemKey={NodeDef.getLabelValue(nodeDef)}
        onChange={selectLabelValue}
        items={booleanAnswerTypes({ i18n })}
      />
    </FormItem>
  )
}

BooleanProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default BooleanProps
