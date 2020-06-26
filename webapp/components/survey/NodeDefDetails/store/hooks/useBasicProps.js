import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'

import * as NodeDefState from '../state'

export const useBasicProps = (props) => {
  const { nodeDefState } = props

  const survey = useSurvey()
  const surveyCycleKey = useSurveyCycleKey()

  const nodeDef = NodeDefState.getNodeDef(nodeDefState)
  const validation = NodeDefState.getValidation(nodeDefState)

  const isEntityAndNotRoot = NodeDef.isEntity(nodeDef) && !NodeDef.isRoot(nodeDef)
  const displayAsEnabled = isEntityAndNotRoot
  const displayInEnabled = isEntityAndNotRoot
  const displayAsTableDisabled = Survey.hasNodeDefChildrenEntities(nodeDef)(survey) || NodeDef.isSingle(nodeDef)

  const displayInParentPageDisabled = NodeDefLayout.isRenderForm(surveyCycleKey)(nodeDef)

  // Survey cycles
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
  const cyclesKeysSurvey = R.pipe(Survey.getSurveyInfo, Survey.getCycleKeys)(survey)
  const cyclesKeysParent = NodeDef.isRoot(nodeDef) ? cyclesKeysSurvey : NodeDef.getCycles(nodeDefParent)

  // Analysis
  const entitySourceHierarchy = Survey.getHierarchy(
    (nodeDefCurrent) => NodeDef.isEntity(nodeDefCurrent) && !NodeDef.isAnalysis(nodeDefCurrent),
    true
  )(survey)

  const renderType = NodeDefLayout.getRenderType(surveyCycleKey)(nodeDef)
  const displayIn = NodeDefLayout.getDisplayIn(surveyCycleKey)(nodeDef)
  const cyclesNodeDef = NodeDef.getCycles(nodeDef)

  return {
    surveyCycleKey,
    nodeDef,
    validation,
    displayAsEnabled,
    displayInEnabled,
    displayAsTableDisabled,
    displayInParentPageDisabled,
    cyclesKeysParent,
    entitySourceHierarchy,
    renderType,
    displayIn,
    cyclesNodeDef,
  }
}
