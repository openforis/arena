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

const AreaBasedEstimated = (props) => {
  const { nodeDef } = props
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

  const handleSwitchAreaBasedEstimated = async (value) => {
    if (value) {
      const chainUuid = Chain.getUuid(chain)
      const parentNodeDef = Survey.getNodeDefParent(nodeDef)(survey)
      const parentName = NodeDef.getName(parentNodeDef)

      const name = `${NodeDef.getName(nodeDef)}_ha`

      const samplingNodeDefInParent = Survey.getNodeDefsArray(survey).find(
        (_nodeDef) => NodeDef.isSampling(_nodeDef) && NodeDef.getParentUuid(_nodeDef) === NodeDef.getUuid(parentNodeDef)
      )

      const props = {
        [NodeDef.propKeys.name]: name,
      }

      const advancedProps = {
        [NodeDef.keysPropsAdvanced.chainUuid]: chainUuid,
        [NodeDef.keysPropsAdvanced.active]: true,
        [NodeDef.keysPropsAdvanced.isBaseUnit]: false,
        [NodeDef.keysPropsAdvanced.isSampling]: true,
        [NodeDef.keysPropsAdvanced.areaBasedEstimatedOf]: NodeDef.getUuid(nodeDef),
        [NodeDef.keysPropsAdvanced.script]: `${parentName}$${name} <- ${parentName}$${NodeDef.getName(
          nodeDef
        )} / ${parentName}$${NodeDef.getName(samplingNodeDefInParent)}`,
      }

      const temporary = true
      const virtual = false
      const nodeDefType = NodeDef.nodeDefType.decimal

      const _nodeDef = NodeDef.newNodeDef(
        parentNodeDef,
        nodeDefType,
        cycleKeys,
        props,
        advancedProps,
        temporary,
        virtual
      )

      dispatch(NodeDefsActions.postNodeDef({ nodeDef: _nodeDef }))
      dispatch({ type: NodeDefsActions.nodeDefCreate, nodeDef: _nodeDef })

      setAreaBasedEstimatedNodeDef(_nodeDef)
    } else {
      dispatch(NodeDefsActions.removeNodeDef(areaBasedEstimatedNodeDef))
      setAreaBasedEstimatedNodeDef(false)
    }
  }

  return (
    <>
      {NodeDef.isDecimal(nodeDef) && !NodeDef.isSampling(nodeDef) && (
        <FormItem label={i18n.t('nodeDefEdit.advancedProps.areaBasedEstimate')} className="">
          <Checkbox checked={!!areaBasedEstimatedNodeDef} onChange={handleSwitchAreaBasedEstimated} />
        </FormItem>
      )}
    </>
  )
}

AreaBasedEstimated.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
  nodeDef: PropTypes.object.isRequired,
}

export default AreaBasedEstimated
