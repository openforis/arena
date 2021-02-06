import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'

import { AnalysisStorage } from '@webapp/service/storage/analysis'

import { NodeDefsActions, useSurveyInfo, useSurvey } from '@webapp/store/survey'

import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'
import { useUpdateAttribute } from './calculation/useUpdateAttribute'
import { State } from '../state'

export const useAddNodeDefAnalysis = ({ setState }) => {
  const dispatch = useDispatch()
  const history = useHistory()

  const survey = useSurvey()
  const surveyInfo = useSurveyInfo()
  const updateAttributeCalculation = useUpdateAttribute({ setState })

  const nodeDefParent = ({ step }) => {
    const entityDefUuid = Step.getEntityUuid(step)
    return entityDefUuid ? Survey.getNodeDefByUuid(entityDefUuid)(survey) : Survey.getNodeDefRoot(survey)
  }

  return useCallback(async ({ state }) => {
    const step = State.getStepEdit(state)
    const calculation = State.getCalculationEdit(state)
    const nodeDefType = Calculation.getNodeDefType(calculation)

    const nodeDef = NodeDef.newNodeDef(
      nodeDefParent({ step }),
      nodeDefType,
      Survey.getCycleKeys(surveyInfo),
      {},
      {},
      true
    )

    await dispatch({ type: NodeDefsActions.nodeDefCreate, nodeDef })
    const updatedState = updateAttributeCalculation({ attrDef: nodeDef, state })
    AnalysisStorage.persistChainEdit(updatedState)
    history.push(`${appModuleUri(analysisModules.nodeDef)}${NodeDef.getUuid(nodeDef)}/`)
  }, [])
}
