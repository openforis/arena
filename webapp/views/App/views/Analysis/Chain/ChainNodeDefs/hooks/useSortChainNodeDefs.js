import { useCallback, useLayoutEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { Sortable } from '@shopify/draggable'
import * as NodeDef from '@core/survey/nodeDef'
import { NodeDefsActions } from '@webapp/store/survey'

export const useSortChainNodeDefs = ({ chainNodeDefsRef, chainNodeDefs = [] }) => {
  const dispatch = useDispatch()

  const sortableRef = useRef(null)

  const updateChainNodeDef = ({ nodeDef, newIndex }) => {
    const newNodeDef = {
      ...nodeDef,
      [NodeDef.keys.propsAdvanced]: {
        ...NodeDef.getPropsAdvanced(nodeDef),
        ...NodeDef.getPropsAdvancedDraft(nodeDef),
        [NodeDef.keysPropsAdvanced.index]: newIndex,
      },
    }

    dispatch(
      NodeDefsActions.putNodeDefProps({
        nodeDefUuid: NodeDef.getUuid(nodeDef),
        parentUuid: NodeDef.getParentUuid(nodeDef),
        props: { ...NodeDef.getProps(nodeDef), ...NodeDef.getPropsDraft(nodeDef) },
        propsAdvanced: { ...NodeDef.getPropsAdvanced(newNodeDef) },
      })
    )

    dispatch(NodeDefsActions.updateNodeDef({ nodeDef: newNodeDef }))
  }

  const initSortable = useCallback(() => {
    if (chainNodeDefs.length > 0 && chainNodeDefsRef.current !== null) {
      sortableRef.current = new Sortable(chainNodeDefsRef.current, {
        draggable: '.chain-node-def',
        handle: '.chain-node-def__btn-move',
        mirror: {
          appendTo: 'body',
          constrainDimensions: true,
        },
      })

      sortableRef.current.on('sortable:stop', (event) => {
        const { newIndex, oldIndex } = event.data
        const chainNodeDef = chainNodeDefs[oldIndex]
        const newChainNodeDefs = [...chainNodeDefs]
        newChainNodeDefs.splice(oldIndex, 1)
        newChainNodeDefs.splice(newIndex, 0, chainNodeDef)

        newChainNodeDefs.forEach((nodeDef, i) => {
          updateChainNodeDef({ nodeDef, newIndex: i })
        })
      })
    }
  }, [chainNodeDefs, chainNodeDefsRef])

  const destroySortable = useCallback(() => {
    if (sortableRef.current) sortableRef.current.destroy()
  }, [])

  useLayoutEffect(() => {
    initSortable()
    return destroySortable
  })
}
