import { useCallback } from 'react'

import { TraverseMethod } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'
import { useChain } from '@webapp/store/ui/chain'

import { State } from '../state'
import { useIsEditingNodeDefInFullScreen } from '@webapp/store/ui/surveyForm'

export const useGetSiblingNodeDefUuid = () => {
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  const editingNodeDefInFullScreen = useIsEditingNodeDefInFullScreen()
  const chain = useChain()

  const getSinglingNodeDefUuids = useCallback(
    ({ nodeDef }) => {
      const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)

      const analysis = NodeDef.isAnalysis(nodeDef)

      let siblingUuids = null
      if (analysis && chain) {
        const analysisDefs = Survey.getAnalysisNodeDefs({ chain })(survey)
        siblingUuids = analysisDefs.map((nodeDef) => NodeDef.getUuid(nodeDef))
      } else {
        if (NodeDefLayout.isRenderTable(cycle)(nodeDefParent)) {
          siblingUuids = NodeDefLayout.getLayoutChildren(cycle)(nodeDefParent)
        } else {
          const layoutChildren = NodeDefLayout.getLayoutChildrenSorted(cycle)(nodeDefParent)
          siblingUuids = layoutChildren.map((layoutItem) => layoutItem.i)
        }
        // filter out not existing and not analysis siblings when the current node def is an analysis node def
        // or not analysis siblings when the current node def is not an analysis node def
        siblingUuids = siblingUuids.filter((siblingUuid) => {
          const siblingNodeDef = Survey.getNodeDefByUuid(siblingUuid)(survey)
          return siblingNodeDef && !NodeDef.isAnalysis(siblingNodeDef)
        })
      }
      return siblingUuids
    },
    [survey, cycle, chain]
  )

  const getAllSurveyNodeDefUuids = useCallback(
    () =>
      Survey.getNodeDefDescendantsAndSelf({ cycle, traverseMethod: TraverseMethod.dfs })(survey).map((nd) =>
        NodeDef.getUuid(nd)
      ),
    [cycle, survey]
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
