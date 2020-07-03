import * as R from 'ramda'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'

import { AnalysisActions } from '@webapp/service/storage'

import { NodeDefsActions, useSurveyInfo, useSurvey } from '@webapp/store/survey'

import * as Step from '@common/analysis/processingStep'

import * as Calculation from '@common/analysis/processingStepCalculation'

export const useAddNodeDefAnalysis = ({ chain, step, stepDirty, calculationState, CalculationState }) => {
  const dispatch = useDispatch()
  const history = useHistory()

  const survey = useSurvey()
  const surveyInfo = useSurveyInfo()

  const { calculation, calculationDirty } = CalculationState.get(calculationState)

  const nodeDefParent = R.pipe(Step.getEntityUuid, (entityDefUuid) => Survey.getNodeDefByUuid(entityDefUuid)(survey))(
    step
  )

  const nodeDefType = Calculation.getNodeDefType(calculation)

  return () => {
    ;(async () => {
      const nodeDef = NodeDef.newNodeDef(nodeDefParent, nodeDefType, Survey.getCycleKeys(surveyInfo), {}, {}, true)

      await dispatch({ type: NodeDefsActions.nodeDefCreate, nodeDef })
      AnalysisActions.persist({ chain, step, stepDirty, calculation, calculationDirty })
      history.push(`${appModuleUri(analysisModules.nodeDef)}${NodeDef.getUuid(nodeDef)}/`)
    })()
  }
}
