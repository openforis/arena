import { useCallback } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'

import { State } from '../state'
import { useIsEditingNodeDefInFullScreen } from '@webapp/store/ui/surveyForm'

export const useGetSiblingNodeDefUuid = () => {
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  const editingNodeDefInFullScreen = useIsEditingNodeDefInFullScreen()

  const getSinglingNodeDefUuids = useCallback(
    ({ nodeDef }) => {
      const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)

      let siblingUuids = null
      if (NodeDefLayout.isRenderTable(cycle)(nodeDefParent)) {
        siblingUuids = NodeDefLayout.getLayoutChildren(cycle)(nodeDefParent)
      } else {
        const layoutChildren = NodeDefLayout.getLayoutChildrenSorted(cycle)(nodeDefParent)
        siblingUuids = layoutChildren.map((layoutItem) => layoutItem.i)
      }
      // filter out not existing and analysis node defs (shown in UI)
      siblingUuids = siblingUuids.filter((siblingUuid) => {
        const siblingNodeDef = Survey.getNodeDefByUuid(siblingUuid)(survey)
        return siblingNodeDef && !NodeDef.isAnalysis(siblingNodeDef)
      })
      return siblingUuids
    },
    [survey, cycle]
  )

  const getAllSurveyNodeDefUuids = useCallback(
    () => Survey.getDescendantsAndSelf()(survey).map(NodeDef.getUuid),
    [survey]
  )

  return useCallback(
    ({ state, offset }) => {
      const nodeDef = State.getNodeDef(state)
      const siblingUuids = editingNodeDefInFullScreen
        ? getSinglingNodeDefUuids({ nodeDef })
        : getAllSurveyNodeDefUuids()

      const nodeDefIndex = siblingUuids.indexOf(NodeDef.getUuid(nodeDef))
      return siblingUuids[nodeDefIndex + offset]
    },
    [editingNodeDefInFullScreen, getAllSurveyNodeDefUuids, getSinglingNodeDefUuids]
  )
}
