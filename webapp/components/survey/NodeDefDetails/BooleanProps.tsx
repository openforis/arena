import { useEffect, useCallback, useMemo } from 'react'

import * as A from '@core/arena'

import { FormItem } from '@webapp/components/form/Input'

import * as NodeDef from '@core/survey/nodeDef'
import ButtonGroup from '@webapp/components/form/ButtonGroup'

import { State, useNodeDefEditReadOnly } from './store'

const booleanAnswerTypes = [
  {
    key: NodeDef.booleanLabelValues.trueFalse,
    label: 'nodeDefEdit:booleanProps.labelValues.trueFalse',
  },
  {
    key: NodeDef.booleanLabelValues.yesNo,
    label: 'nodeDefEdit:booleanProps.labelValues.yesNo',
  },
]

type BooleanPropsProps = {
  state: Record<string, any>
  Actions: Record<string, any>
}

const BooleanProps = (props: BooleanPropsProps) => {
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
  }, [nodeDef, selectLabelValue])

  return (
    <FormItem label="nodeDefEdit:booleanProps.labelValue">
      <ButtonGroup
        disabled={readOnly}
        selectedItemKey={NodeDef.getLabelValue(nodeDef)}
        onChange={selectLabelValue}
        items={booleanAnswerTypes}
      />
    </FormItem>
  )
}

export default BooleanProps
