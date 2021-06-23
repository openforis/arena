import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'

import { useIsKeyEditDisabled } from './useIsKeyEditDisabled'
import { useIsMultipleEditDisabled } from './useIsMultipleEditDisabled'

import { State } from '../../store'

export const useBasicProps = (props) => {
  const { state } = props

  const survey = useSurvey()
  const surveyCycleKey = useSurveyCycleKey()

  const nodeDef = State.getNodeDef(state)
  const validation = State.getValidation(state)

  const displayAsEnabled = NodeDef.isDisplayAsEnabled(nodeDef)
  const displayInEnabled = NodeDef.isDisplayInEnabled(nodeDef)
  const displayAsTableDisabled = Survey.hasNodeDefChildrenEntities(nodeDef)(survey) || NodeDef.isSingle(nodeDef)
  const displayInParentPageDisabled = NodeDefLayout.isRenderForm(surveyCycleKey)(nodeDef)
  const keyEditDisabled = useIsKeyEditDisabled({ nodeDef })
  const multipleEditDisabled = useIsMultipleEditDisabled({ nodeDef })

  // Survey cycles
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
  const cyclesKeysSurvey = R.pipe(Survey.getSurveyInfo, Survey.getCycleKeys)(survey)
  const cyclesKeysParent = NodeDef.isRoot(nodeDef) ? cyclesKeysSurvey : NodeDef.getCycles(nodeDefParent)

  // Analysis
  const entitySourceHierarchy = Survey.getHierarchy(
    (nodeDefCurrent) => NodeDef.isEntity(nodeDefCurrent) && !NodeDef.isAnalysis(nodeDefCurrent)
  )(survey)

  const renderType = NodeDefLayout.getRenderType(surveyCycleKey)(nodeDef)
  const displayIn = NodeDefLayout.getDisplayIn(surveyCycleKey)(nodeDef)
  const cyclesNodeDef = NodeDef.getCycles(nodeDef)

  return {
    nodeDef,
    validation,
    displayAsEnabled,
    displayInEnabled,
    displayAsTableDisabled,
    displayInParentPageDisabled,
    keyEditDisabled,
    multipleEditDisabled,
    cyclesKeysParent,
    entitySourceHierarchy,
    renderType,
    displayIn,
    cyclesNodeDef,
  }
}
