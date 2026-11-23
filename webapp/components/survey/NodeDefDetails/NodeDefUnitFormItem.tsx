import { FormItem, Input } from '@webapp/components/form/Input'

import * as NodeDef from '@core/survey/nodeDef'

import { State, useNodeDefEditReadOnly } from './store'

type NodeDefUnitFormItemProps = {
  state: Record<string, any>
  Actions: Record<string, any>
}

const NodeDefUnitFormItem = (props: NodeDefUnitFormItemProps) => {
  const { state, Actions } = props

  const readOnly = useNodeDefEditReadOnly()
  const nodeDef = State.getNodeDef(state)

  if (!NodeDef.isAnalysis(nodeDef)) return null

  return (
    <FormItem label="nodeDefEdit:numericProps.unit">
      <Input
        className="node-def-unit-input"
        onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.unit, value })}
        readOnly={readOnly}
        value={NodeDef.getUnit(nodeDef)}
      />
    </FormItem>
  )
}

export default NodeDefUnitFormItem
