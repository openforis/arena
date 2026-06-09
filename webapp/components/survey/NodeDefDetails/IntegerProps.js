import PropTypes from 'prop-types'

import { FormItem, Input } from '@webapp/components/form/Input'

import * as NodeDef from '@core/survey/nodeDef'

import { State } from './store'

const IntegerProps = (props) => {
  const { state, Actions } = props

  const nodeDef = State.getNodeDef(state)

  if (!NodeDef.isAnalysis(nodeDef)) return null

  return (
    <FormItem label="nodeDefEdit.numericProps.unit">
      <div style={{ width: '10rem' }}>
        <Input
          value={NodeDef.getUnit(nodeDef)}
          onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.unit, value })}
        />
      </div>
    </FormItem>
  )
}

IntegerProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default IntegerProps
