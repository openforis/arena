import { useCallback, useLayoutEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { Sortable } from '@shopify/draggable'
import * as NodeDef from '@core/survey/nodeDef'
import { NodeDefsActions } from '@webapp/store/survey'

export const useSortAnalysisNodeDefs = ({ analysisNodeDefsRef, analysisNodeDefs = [] }) => {
  const dispatch = useDispatch()

  const sortableRef = useRef(null)

  const initSortable = useCallback(() => {
    if (analysisNodeDefs.length > 0 && analysisNodeDefsRef.current !== null) {
      sortableRef.current = new Sortable(analysisNodeDefsRef.current, {
        draggable: '.analysis-node-def',
        handle: '.analysis-node-def__btn-move',
        mirror: {
          appendTo: 'body',
          constrainDimensions: true,
        },
      })

      sortableRef.current.on('sortable:stop', (event) => {
        const { newIndex, oldIndex } = event.data
        const analysisNodeDef = analysisNodeDefs[oldIndex]
        const newAnalysisNodeDefs = [...analysisNodeDefs]
        newAnalysisNodeDefs.splice(oldIndex, 1)
        newAnalysisNodeDefs.splice(newIndex, 0, analysisNodeDef)

        const newAnalysisNodeDefsSorted = newAnalysisNodeDefs.map((nodeDef, i) => {
          const nodeDefUpdated = NodeDef.assocProp({ key: NodeDef.keysPropsAdvanced.index, value: i })(nodeDef)
          dispatch(NodeDefsActions.updateNodeDef({ nodeDef: nodeDefUpdated }))
          return {
            nodeDefUuid: NodeDef.getUuid(nodeDef),
            parentUuid: NodeDef.getParentUuid(nodeDef),
            propsAdvanced: { [NodeDef.keysPropsAdvanced.index]: i },
          }
        })

        dispatch(NodeDefsActions.putNodeDefsProps({ nodeDefs: newAnalysisNodeDefsSorted }))
      })
    }
  }, [analysisNodeDefs, analysisNodeDefsRef])

  const destroySortable = useCallback(() => {
    if (sortableRef.current) sortableRef.current.destroy()
  }, [])

  useLayoutEffect(() => {
    initSortable()
    return destroySortable
  })
}
