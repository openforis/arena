import { useCallback, useLayoutEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { Sortable } from '@shopify/draggable'

import { ChainActions, useChainNodeDefs } from '@webapp/store/ui/chain'

export const useSortChainNodeDefs = ({ chainNodeDefsRef }) => {
  const dispatch = useDispatch()
  const chainNodeDefs = useChainNodeDefs()
  const sortableRef = useRef(null)

  const initSortable = useCallback(() => {
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
      dispatch(ChainActions.updateChainNodeDefIndex({ chainNodeDef, newIndex }))
    })
  }, [chainNodeDefs])

  const destroySortable = useCallback(() => {
    if (sortableRef.current) sortableRef.current.destroy()
  }, [])

  useLayoutEffect(() => {
    if (chainNodeDefs.length > 0) initSortable()
    return destroySortable
  }, [chainNodeDefs])
}
