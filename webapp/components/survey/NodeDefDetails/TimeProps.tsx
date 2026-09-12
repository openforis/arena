import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import { Checkbox } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'

import { State, useNodeDefEditReadOnly } from './store'

type NodeDefEditState = {
  nodeDef: Parameters<typeof NodeDef.isSecondsIncluded>[0]
}

type TimePropsProps = {
  state: NodeDefEditState
  Actions: { setProp: (args: { state: NodeDefEditState; key: string; value: boolean }) => void }
}

const TimeProps = (props: TimePropsProps) => {
  const { state, Actions } = props
  const readOnly = useNodeDefEditReadOnly()

  const nodeDef = State.getNodeDef(state)

  return (
    <FormItem label="">
      <Checkbox
        checked={NodeDef.isSecondsIncluded(nodeDef)}
        disabled={readOnly}
        label="nodeDefEdit.timeProps.includeSeconds"
        onChange={(value: boolean) => Actions.setProp({ state, key: NodeDef.propKeys.includeSeconds, value })}
      />
    </FormItem>
  )
}

TimeProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default TimeProps
