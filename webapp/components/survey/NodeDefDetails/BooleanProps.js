import React, { useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'

import { FormItem } from '@webapp/components/form/Input'

import * as NodeDef from '@core/survey/nodeDef'
import ButtonGroup from '@webapp/components/form/buttonGroup'

import { State } from './store'

const booleanAnswerTypes = [
  {
    key: NodeDef.booleanLabelValues.trueFalse,
    label: 'nodeDefEdit.booleanProps.labelValues.trueFalse',
  },
  {
    key: NodeDef.booleanLabelValues.yesNo,
    label: 'nodeDefEdit.booleanProps.labelValues.yesNo',
  },
]

const BooleanProps = (props) => {
  const { state, Actions } = props

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
    <FormItem label="nodeDefEdit.booleanProps.labelValue">
      <ButtonGroup
        selectedItemKey={NodeDef.getLabelValue(nodeDef)}
        onChange={selectLabelValue}
        items={booleanAnswerTypes}
      />
    </FormItem>
  )
}

BooleanProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default BooleanProps
