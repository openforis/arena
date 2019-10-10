import React, { useEffect, useRef, useState } from 'react'

import NodeDefSwitch from '../../nodeDefSwitch'
import ProgressBar from '../../../../../../commonComponents/progressBar'

import NodeDef from '../../../../../../../common/survey/nodeDef'
import NodeDefLayout from '../../../../../../../common/survey/nodeDefLayout'
import * as NodeDefUiProps from '../../nodeDefUIProps'

const NodeDefEntityTableCell = props => {

  const {
    nodeDef, parentNode,
    canEditDef, renderType,
    onDragStart, onDragOver, onDragEnd,
    gridSize, windowed,
  } = props

  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  const { length } = NodeDefUiProps.getFormFields(nodeDef)
  const elementRef = useRef(null)

  // table cell header is always visible
  const isHeader = renderType === NodeDefLayout.renderType.tableHeader
  const [visible, setVisible] = useState(isHeader || !windowed)

  if (!isHeader && windowed) {
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

        const elemVisible = (
          elemtTop <= gridBottom && elemBottom >= gridTop // vertical visibility
          &&
          elemLeft <= gridRight && elemRight >= gridLeft // horizontal visibility
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

NodeDefEntityTableCell.defaultProps = {
  gridSize: {}, // coordinates of the grid size where it's contained
  windowed: true, // used to load component only when visible in parent grid
}

export default NodeDefEntityTableCell
