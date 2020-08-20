import React, { useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'

import { useI18n } from '@webapp/store/system'
import { FormItem } from '@webapp/components/form/Input'

import * as NodeDef from '@core/survey/nodeDef'
import ButtonGroup from '@webapp/components/form/buttonGroup'

import { State } from './store'

const booleanAnswerTypes = ({ i18n }) => [
  {
    key: NodeDef.booleanLabelValueTypes.trueFalse,
    label: i18n.t('nodeDefEdit.booleanProps.labelValueTypes.trueFalse'),
  },
  {
    key: NodeDef.booleanLabelValueTypes.yesNo,
    label: i18n.t('nodeDefEdit.booleanProps.labelValueTypes.yesNo'),
  },
]

const DEFAULT_ANSWER_LABELS_TYPE = NodeDef.booleanLabelValueTypes.trueFalse

const BooleanProps = (props) => {
  const { state, Actions } = props

  const i18n = useI18n()

  const nodeDef = State.getNodeDef(state)

  const selectLabelValueType = useCallback(
    (value) => {
      Actions.setProp({ state, key: NodeDef.propKeys.labelValueType, value })
    },
    [state]
  )

  useEffect(() => {
    if (A.isEmpty(NodeDef.getLabelValueType(nodeDef))) {
      selectLabelValueType(DEFAULT_ANSWER_LABELS_TYPE)
    }
  }, [])

  return (
    <FormItem label={i18n.t('nodeDefEdit.booleanProps.labelValue')}>
      <ButtonGroup
        selectedItemKey={NodeDef.getLabelValueType(nodeDef)}
        onChange={selectLabelValueType}
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
