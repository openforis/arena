import React, { useEffect, useRef, useState } from 'react'

import NodeDefSwitch from '../../nodeDefSwitch'
import ProgressBar from '../../../../../../commonComponents/progressBar'

import NodeDef from '../../../../../../../common/survey/nodeDef'
import NodeDefLayout from '../../../../../../../common/survey/nodeDefLayout'
import * as NodeDefUiProps from '../../nodeDefUIProps'

const NodeDefEntityTableCell = props => {

  const {
    edit, nodeDef, parentNode,
    canEditDef, renderType,
    onDragStart, onDragOver, onDragEnd,
    gridSize
  } = props

  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  const { length } = NodeDefUiProps.getNodeDefFormFields(nodeDef)

  const elementRef = useRef(null)

  // table cell header is always visible
  const isHeader = renderType === NodeDefLayout.nodeDefRenderType.tableHeader
  const [visible, setVisible] = useState(isHeader)

  if (!isHeader) {
    useEffect(() => {
      if (gridSize) {
        const el = elementRef.current

        const elemtTop = el.offsetParent.offsetTop
        const elemBottom = elemtTop + el.offsetHeight
        const elemLeft = el.offsetLeft
        const elemRight = elemLeft + el.offsetWidth

        const gridTop = gridSize.top
        const gridBottom = gridSize.height + gridTop
        const gridLeft = gridSize.left
        const gridRight = gridSize.width + gridLeft

        const elemVisible = edit || (
          // vertical visibility
          (
            (elemtTop >= gridTop && elemBottom <= gridBottom) // fully contained
            ||
            (elemtTop < gridTop && elemBottom > gridTop) // top intersection
            ||
            (elemBottom > gridBottom && elemtTop < gridBottom) // bottom intersection
          ) &&
          // horizontal visibility
          (
            (elemLeft >= gridLeft && elemRight <= gridRight) // fully contained
            ||
            (elemLeft < gridLeft && elemRight > gridLeft) // left intersection
            ||
            (elemRight > gridRight && elemLeft < gridRight) // right intersection
          )
        )
        setVisible(elemVisible)
      }

    }, [gridSize])
  }

  return (
    <div ref={elementRef}
         data-uuid={nodeDefUuid}
         className="react-grid-item draggable-item"
         style={{ width: 160 * length + 'px' }}
         onMouseDown={e => e.stopPropagation()}
         draggable={canEditDef}
         onDragStart={onDragStart}
         onDragOver={onDragOver}
         onDragEnd={onDragEnd}>
      {
        visible
          ? (
            <NodeDefSwitch
              {...props}
              node={null}
              nodeDef={nodeDef}
              parentNode={parentNode}
              renderType={renderType}
            />
          )
          : (
            <div className="survey-form__node-def-entity-table-cell-placeholder">
              <ProgressBar
                className="running progress-bar-striped"
                progress={100}
                showText={false}/>
            </div>
          )
      }
    </div>
  )
}

export default NodeDefEntityTableCell