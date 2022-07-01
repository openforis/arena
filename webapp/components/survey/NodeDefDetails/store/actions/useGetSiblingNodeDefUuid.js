import { useCallback } from 'react'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'

import { State } from '../state'

export const useGetSiblingNodeDefUuid = () => {
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()

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
      // filter existing node defs (shown in UI)
      siblingUuids = siblingUuids.filter((siblingUuid) => Survey.getNodeDefByUuid(siblingUuid)(survey))
      return siblingUuids
    },
    [survey, cycle]
  )

  return useCallback(
    ({ state, offset }) => {
      const nodeDef = State.getNodeDef(state)
      const siblingUuids = getSinglingNodeDefUuids({ nodeDef })

      const nodeDefIndex = siblingUuids.indexOf(NodeDef.getUuid(nodeDef))
      return siblingUuids[nodeDefIndex + offset]
    },
    [getSinglingNodeDefUuids]
  )
}
