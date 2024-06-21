import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as NodeDef from '@core/survey/nodeDef'

import { useSortable } from '@webapp/components/hooks'
import { NodeDefsActions } from '@webapp/store/survey'

export const useSortAnalysisNodeDefs = ({ analysisNodeDefsContainerRef, analysisNodeDefs = [] }) => {
  const dispatch = useDispatch()

  const onItemsSort = useCallback(
    (newAnalysisNodeDefs) => {
      const newAnalysisNodeDefsSorted = newAnalysisNodeDefs.map((nodeDef, i) => {
        const nodeDefUpdated = NodeDef.assocProp({ key: NodeDef.keysPropsAdvanced.index, value: i })(nodeDef)
        dispatch(NodeDefsActions.updateNodeDef({ nodeDef: nodeDefUpdated }))
        return {
          nodeDefUuid: NodeDef.getUuid(nodeDef),
          propsAdvanced: { [NodeDef.keysPropsAdvanced.index]: i },
        }
      })
      dispatch(NodeDefsActions.putNodeDefsProps({ nodeDefs: newAnalysisNodeDefsSorted }))
    },
    [dispatch]
  )

  useSortable({
    containerRef: analysisNodeDefsContainerRef,
    draggableClassName: '.analysis-node-def',
    handleClassName: '.analysis-node-def__btn-move',
    items: analysisNodeDefs,
    onItemsSort,
  })
}
