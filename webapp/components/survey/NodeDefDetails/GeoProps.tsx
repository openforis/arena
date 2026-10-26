import * as NodeDef from '@core/survey/nodeDef'

import { ButtonIconInfo } from '@webapp/components/buttons'
import { Checkbox } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { useSystemConfigExperimentalFeatures } from '@webapp/store/system'

import { State, useNodeDefEditReadOnly } from './store'

type NodeDefEditState = {
  nodeDef: Parameters<typeof NodeDef.isPositionTracking>[0]
}

type GeoPropsProps = {
  state: NodeDefEditState
  Actions: { setProp: (args: { state: NodeDefEditState; key: string; value: boolean }) => void }
}

const GeoProps = (props: GeoPropsProps) => {
  const { state, Actions } = props
  const readOnly = useNodeDefEditReadOnly()
  // position tracking is experimental: shown only when EXPERIMENTAL_FEATURES is enabled
  const experimentalFeatures = useSystemConfigExperimentalFeatures()

  const nodeDef = State.getNodeDef(state)

  if (!experimentalFeatures || !NodeDef.canBePositionTracking(nodeDef)) return null

  return (
    <FormItem label="nodeDefEdit:geoProps.positionTracking">
      <div className="form-item_body checkbox-with-info">
        <ButtonIconInfo title="nodeDefEdit:geoProps.positionTrackingInfo" />
        <Checkbox
          checked={NodeDef.isPositionTracking(nodeDef)}
          disabled={readOnly}
          onChange={(value: boolean) => Actions.setProp({ state, key: NodeDef.propKeys.positionTracking, value })}
        />
      </div>
    </FormItem>
  )
}

export default GeoProps
