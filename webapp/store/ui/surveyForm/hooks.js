import { useSelector } from 'react-redux'

import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { TreeSelectViewMode } from '@webapp/model'
import { SurveyState } from '@webapp/store/survey'

import * as SurveyFormState from './state'

export const useNodeDefLabelType = () => useSelector(SurveyFormState.getNodeDefLabelType)

export const useTreeSelectViewMode = () => useSelector(SurveyFormState.getTreeSelectViewMode)

export const useIsEditingNodeDefInFullScreen = () => useTreeSelectViewMode() === TreeSelectViewMode.onlyPages

export const useActiveNodeDefUuid = () => useSelector(SurveyFormState.getFormActiveNodeDefUuid)

export const useNodeDefPage = () => useSelector(SurveyFormState.getFormActivePageNodeDef)

export const useShowPageNavigation = () => useSelector(SurveyFormState.showPageNavigation)

export const usePagesUuidMap = () => useSelector(SurveyFormState.getPagesUuidMap)

const visitSurveyEntityDefsInOwnPage = ({ survey, cycle, visitor }) => {
  const nodeDefRoot = Survey.getNodeDefRoot(survey)
  const stack = [nodeDefRoot]
  while (stack.length > 0) {
    const currentEntityDef = stack.pop()
    visitor(currentEntityDef)
    const childrenInOwnPage = Survey.getNodeDefChildrenInOwnPage({ nodeDef: currentEntityDef, cycle })(survey)
    stack.push(...childrenInOwnPage)
  }
}

export const useNotAvailableEntityPageUuids = ({ edit }) =>
  useSelector((state) => {
    const result = []
    const survey = SurveyState.getSurvey(state)
    const cycle = SurveyState.getSurveyCycleKey(state)
    const nodeDefRoot = Survey.getNodeDefRoot(survey)

    visitSurveyEntityDefsInOwnPage({
      survey,
      cycle,
      visitor: (currentEntityDef) => {
        const parentNodeArg = SurveyFormState.getFormPageParentNode(currentEntityDef)(state)
        if (
          !edit &&
          !parentNodeArg &&
          !NodeDef.isRoot(currentEntityDef) &&
          NodeDef.getParentUuid(currentEntityDef) !== NodeDef.getUuid(nodeDefRoot)
        ) {
          result.push(currentEntityDef)
        }
      },
    })

    return result.map(NodeDef.getUuid)
  }, Objects.isEqual)
