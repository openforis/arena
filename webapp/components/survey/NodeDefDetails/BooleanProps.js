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
    key: NodeDef.booleanAnswerLabelsTypes.trueFalse,
    label: i18n.t('nodeDefEdit.booleanProps.answerLabelsTypes.trueFalse'),
  },
  {
    key: NodeDef.booleanAnswerLabelsTypes.yesNo,
    label: i18n.t('nodeDefEdit.booleanProps.answerLabelsTypes.yesNo'),
  },
]

const DEFAULT_ANSWER_LABELS_TYPE = NodeDef.booleanAnswerLabelsTypes.trueFalse
const BooleanProps = (props) => {
  const { state, Actions } = props

  const i18n = useI18n()

  const nodeDef = State.getNodeDef(state)

  const selectAnswerLabelType = useCallback(
    (value) => {
      Actions.setProp({ state, key: NodeDef.propKeys.answerLabelsType, value })
    },
    [state]
  )

  useEffect(() => {
    if (A.isEmpty(NodeDef.getAnswerLabelsType(nodeDef))) {
      selectAnswerLabelType(DEFAULT_ANSWER_LABELS_TYPE)
    }
  }, [])

  return (
    <FormItem label={i18n.t('nodeDefEdit.booleanProps.answerLabels')}>
      <ButtonGroup
        selectedItemKey={NodeDef.getAnswerLabelsType(nodeDef)}
        onChange={selectAnswerLabelType}
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
