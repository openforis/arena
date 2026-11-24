import { useState } from 'react'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { useSurvey } from '@webapp/store/survey'

import Checkbox from '@webapp/components/form/Checkbox'
import { FormItem } from '@webapp/components/form/Input'

import { useNodeDefEditReadOnly } from '../../store'
import type { ArenaAnyNodeDef } from '@openforis/arena-core'

type AreaBasedEstimatedProps = {
  nodeDef: ArenaAnyNodeDef
  Actions: Record<string, any>
  state: Record<string, any>
}

const AreaBasedEstimated = (props: AreaBasedEstimatedProps) => {
  const { nodeDef, state, Actions } = props

  const survey = useSurvey()
  const readOnly = useNodeDefEditReadOnly()

  const [hasAreaBasedEstimateNodeDef, setHasAreaBasedEstimateNodeDef] = useState(
    !!Survey.getNodeDefAreaBasedEstimate(nodeDef)(survey)
  )

  if (NodeDef.isDecimal(nodeDef) && !NodeDef.isSampling(nodeDef)) {
    return (
      <FormItem label="nodeDefEdit:advancedProps.areaBasedEstimate">
        <Checkbox
          checked={hasAreaBasedEstimateNodeDef}
          disabled={readOnly}
          onChange={(value) => {
            setHasAreaBasedEstimateNodeDef(value)
            Actions.setProp({ state, key: NodeDef.keysPropsAdvanced.hasAreaBasedEstimated, value })
          }}
        />
      </FormItem>
    )
  }
  return null
}

export default AreaBasedEstimated
