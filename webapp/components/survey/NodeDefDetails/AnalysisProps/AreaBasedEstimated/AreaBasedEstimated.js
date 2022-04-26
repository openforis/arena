import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import * as Chain from '@common/analysis/chain'

import { useI18n } from '@webapp/store/system'
import { useChain } from '@webapp/store/ui/chain'
import { FormItem } from '@webapp/components/form/Input'
import { useSurvey, useSurveyCycleKeys, NodeDefsActions } from '@webapp/store/survey'
import Checkbox from '@webapp/components/form/checkbox'
import { AreaBasedEstimatedOfNodeDef } from '@common/analysis/areaBasedEstimatedNodeDef'

const AreaBasedEstimated = (props) => {
  const { nodeDef, state, Actions } = props
  const [areaBasedEstimatedNodeDef, setAreaBasedEstimatedNodeDef] = useState(false)

  const dispatch = useDispatch()

  const survey = useSurvey()
  const cycleKeys = useSurveyCycleKeys()
  const chain = useChain()

  const i18n = useI18n()

  useEffect(() => {
    const _areaBasedEstimatedNodeDef = Survey.getNodeDefAreaBasedEstimate(nodeDef)(survey)
    if (_areaBasedEstimatedNodeDef) {
      setAreaBasedEstimatedNodeDef(_areaBasedEstimatedNodeDef)
    }
  }, [nodeDef])

  const handleSwitchAreaBasedEstimated = async (value = false) => {
    if (value) {
      const chainUuid = Chain.getUuid(chain)
      const _nodeDef = AreaBasedEstimatedOfNodeDef.newNodeDef({
        survey,
        cycleKeys,
        chainUuid,
        estimatedOfNodeDef: nodeDef,
      })

      dispatch(NodeDefsActions.postNodeDef({ nodeDef: _nodeDef }))
      dispatch({ type: NodeDefsActions.nodeDefCreate, nodeDef: _nodeDef })
      Actions.setProp({ state, key: 'hasAreaBasedEstimated', value: true })
      setAreaBasedEstimatedNodeDef(_nodeDef)
    } else {
      dispatch(
        NodeDefsActions.removeNodeDef(areaBasedEstimatedNodeDef, null, () => {
          setAreaBasedEstimatedNodeDef(false)
          Actions.setProp({ state, key: 'hasAreaBasedEstimated', value: false })
        })
      )
    }
  }

  if (NodeDef.isDecimal(nodeDef) && !NodeDef.isSampling(nodeDef)) {
    return (
      <FormItem label={i18n.t('nodeDefEdit.advancedProps.areaBasedEstimate')} className="">
        <Checkbox checked={!!areaBasedEstimatedNodeDef} onChange={handleSwitchAreaBasedEstimated} />
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
