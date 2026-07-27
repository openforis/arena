import React, { useEffect, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'

import { FormItem } from '@webapp/components/form/Input'

import * as NodeDef from '@core/survey/nodeDef'
import ButtonGroup from '@webapp/components/form/buttonGroup'

import { State, useNodeDefEditReadOnly } from './store'

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

  const readOnly = useNodeDefEditReadOnly()
  const nodeDef = useMemo(() => State.getNodeDef(state), [state])

  const selectLabelValue = useCallback(
    (value) => {
      Actions.setProp({ state, key: NodeDef.propKeys.labelValue, value })
    },
    [Actions, state]
  )

  useEffect(() => {
    if (A.isEmpty(NodeDef.getLabelValue(nodeDef))) {
      selectLabelValue(NodeDef.booleanLabelValues.trueFalse)
    }
  }, [nodeDef])

  return (
    <FormItem label="nodeDefEdit.booleanProps.labelValue">
      <ButtonGroup
        disabled={readOnly}
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
