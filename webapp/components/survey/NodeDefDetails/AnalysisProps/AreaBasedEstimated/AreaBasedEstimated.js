import React, { useState } from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { useSurvey } from '@webapp/store/survey'

import Checkbox from '@webapp/components/form/checkbox'
import { FormItem } from '@webapp/components/form/Input'

const AreaBasedEstimated = (props) => {
  const { nodeDef, state, Actions } = props

  const survey = useSurvey()

  const [hasAreaBasedEstimateNodeDef, setHasAreaBasedEstimateNodeDef] = useState(
    !!Survey.getNodeDefAreaBasedEstimate(nodeDef)(survey)
  )

  if (NodeDef.isDecimal(nodeDef) && !NodeDef.isSampling(nodeDef)) {
    return (
      <FormItem label="nodeDefEdit.advancedProps.areaBasedEstimate">
        <Checkbox
          checked={hasAreaBasedEstimateNodeDef}
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

AreaBasedEstimated.propTypes = {
  nodeDef: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
  state: PropTypes.object.isRequired,
}

export default AreaBasedEstimated
