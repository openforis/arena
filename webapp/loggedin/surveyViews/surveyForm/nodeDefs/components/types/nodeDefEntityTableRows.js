import React, { useEffect, useRef, useState } from 'react'
import * as R from 'ramda'

import NodeDefEntityTableRow from './nodeDefEntityTableRow'

import NodeDef from '../../../../../../../common/survey/nodeDef'
import NodeDefLayout from '../../../../../../../common/survey/nodeDefLayout'

import { elementOffset } from '../../../../../../utils/domUtils'
import { debounce } from '../../../../../../../common/functionsDefer'

const NodeDefEntityTableRows = props => {

  const {
    entry, edit,
    nodeDef, childDefs, nodes,
  } = props

  const tableRowsRef = useRef(null)
  const tableDataRowsRef = useRef(null)

  const [nodeDefColumns, setNodeDefColumns] = useState([])
  const [gridSize, setGridSize] = useState({ width: 0, height: 0, top: 0, left: 0 })
  const debounceDelayOnScroll = 100

  const nodeDefUuid = NodeDef.getUuid(nodeDef)

  // nodeDef change effect
  useEffect(() => {
    // set nodeDefColumns
    const nodeDefColumnUuids = NodeDefLayout.getLayout(nodeDef)
    const nodeDefColumnsUpdate = []
    nodeDefColumnUuids.forEach(uuid => {
      const nodeDefChild = childDefs.find(def => def.uuid === uuid)
      if (nodeDefChild) {
        nodeDefColumnsUpdate.push(nodeDefChild)
      }
    })
    setNodeDefColumns(nodeDefColumnsUpdate)

    //entry mode
    if (!edit) {
      // reset scrolls and set grid size
      tableRowsRef.current.scrollLeft = 0
      tableDataRowsRef.current.scrollTop = 0

      const updateGridSize = () => {
        const { width } = elementOffset(tableRowsRef.current)
        const { height } = elementOffset(tableDataRowsRef.current)

        setGridSize(gridSizePrev => ({
          ...gridSizePrev, width, height
        }))
      }

      updateGridSize()

      //add resize event listener
      const onWindowResize = () => {
        debounce(updateGridSize, 'upgrade-grid-size', 200)()
      }
      window.addEventListener('resize', onWindowResize)

      return () => {
        window.removeEventListener('resize', onWindowResize)
      }
    }
  }, [nodeDefUuid])

  const onScrollTableRows = () => {
    const onScroll = () => {
      const { scrollLeft } = tableRowsRef.current
      if (scrollLeft !== gridSize.left) {
        setGridSize(gridSizePrev => ({
          ...gridSizePrev,
          left: scrollLeft,
        }))
      }
    }
    debounce(onScroll, 'scroll-table-rows', debounceDelayOnScroll)()
  }

  const onScrollTableDataRows = () => {
    const onScroll = () => {
      const { scrollTop } = tableDataRowsRef.current
      if (scrollTop !== gridSize.top) {
        setGridSize(gridSizePrev => ({
          ...gridSizePrev,
          top: scrollTop,
        }))
      }
    }
    debounce(onScroll, 'scroll-table-data-rows', debounceDelayOnScroll)()
  }

  return (
    <div className="survey-form__node-def-entity-table-rows"
         ref={tableRowsRef}
         onScroll={onScrollTableRows}>

      {
        (edit || !R.isEmpty(nodes)) &&
        <NodeDefEntityTableRow
          {...props}
          node={null}
          renderType={NodeDefLayout.nodeDefRenderType.tableHeader}
          gridSize={gridSize}
          nodeDefColumns={nodeDefColumns}/>
      }

      {
        entry &&
        <div className="survey-form__node-def-entity-table-data-rows"
             ref={tableDataRowsRef}
             onScroll={onScrollTableDataRows}>
          {
            gridSize.height > 0 && gridSize.width > 0 &&
            nodes.map((node, i) =>
              <NodeDefEntityTableRow
                key={i}
                i={i}
                {...props}
                node={node}
                nodes={null}
                renderType={NodeDefLayout.nodeDefRenderType.tableBody}
                gridSize={gridSize}
                nodeDefColumns={nodeDefColumns}
              />
            )
          }
        </div>

      }

    </div>
  )
}

export default NodeDefEntityTableRows