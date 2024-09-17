import React, { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { ResizableBox } from 'react-resizable'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import ProgressBar from '@webapp/components/progressBar'
import { NodeDefsActions, useSurveyCycleKey } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'

import NodeDefSwitch from '../../nodeDefSwitch'
import * as NodeDefUiProps from '../../nodeDefUIProps'

const NodeDefEntityTableCellContent = (props) => {
  const { children, fieldsLength, nodeDef, onResizeStart, onResizeStop, resizable, width } = props

  const className = 'survey-form__node-def-entity-table-cell-content'
  const testId = TestId.surveyForm.nodeDefEntityTableCellWrapper(NodeDef.getName(nodeDef))

  if (!resizable)
    return (
      <div data-testid={testId} className={className} style={{ width: `${width}px` }}>
        {children}
      </div>
    )

  return (
    <ResizableBox
      data-testid={testId}
      className={className}
      width={width}
      height={40}
      axis="x"
      handleSize={[25, 25]}
      onResizeStart={onResizeStart}
      onResizeStop={onResizeStop}
      minConstraints={[NodeDefLayout.columnWidthMinPx * fieldsLength, 40]}
      maxConstraints={[NodeDefLayout.columnWidthMaxPx * fieldsLength, 40]}
    >
      {children}
    </ResizableBox>
  )
}

const NodeDefEntityTableCell = (props) => {
  const {
    draggable,
    gridSize = {},
    nodeDef,
    onDragStart,
    onDragOver,
    onDragEnd,
    onResizeStart,
    onResizeStop: onResizeStopProp,
    parentNode = null,
    renderType,
    resizable,
    windowed = true,
  } = props

  const cycle = useSurveyCycleKey()
  const elementRef = useRef(null)
  const dispatch = useDispatch()

  // Table cell header is always visible
  const isHeader = renderType === NodeDefLayout.renderType.tableHeader
  const [visible, setVisible] = useState(isHeader || !windowed)

  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  const fieldsLength = NodeDefUiProps.getFormFieldsLength(nodeDef)
  const widthValue = NodeDefLayout.getColumnWidthValue(cycle)(nodeDef)
  const totalWidthValue = fieldsLength * widthValue

  useEffect(() => {
    if (isHeader || !windowed || !gridSize) {
      return
    }
    const el = elementRef.current

    const elemtTop = el.offsetParent.offsetTop
    const elemBottom = elemtTop + el.offsetHeight
    const elemLeft = el.offsetLeft
    const elemRight = elemLeft + el.offsetWidth

    const { top: gridTop, height: gridHeight, left: gridLeft, width: gridWidth } = gridSize
    const gridBottom = gridHeight + gridTop
    const gridRight = gridWidth + gridLeft

    const elemVisible =
      elemtTop <= gridBottom &&
      elemBottom >= gridTop && // Vertical visibility
      elemLeft <= gridRight &&
      elemRight >= gridLeft // Horizontal visibility
    setVisible(elemVisible)
  }, [gridSize])

  const onResizeStop = (_e, { size }) => {
    const { width } = size

    const fieldWidth = Math.ceil(width / fieldsLength)
    if (!fieldWidth || fieldWidth < NodeDefLayout.columnWidthMinPx) return

    dispatch(
      NodeDefsActions.putNodeDefLayoutProp({
        nodeDef,
        key: NodeDefLayout.keys.columnWidth,
        value: `${fieldWidth}px`,
      })
    )

    onResizeStopProp()
  }

  return (
    <div
      ref={elementRef}
      data-uuid={nodeDefUuid}
      className="react-grid-item draggable-item"
      onMouseDown={(e) => e.stopPropagation()}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <NodeDefEntityTableCellContent
        fieldsLength={fieldsLength}
        nodeDef={nodeDef}
        onResizeStart={onResizeStart}
        onResizeStop={onResizeStop}
        resizable={resizable}
        width={totalWidthValue}
      >
        {visible ? (
          <NodeDefSwitch {...props} node={null} nodeDef={nodeDef} parentNode={parentNode} renderType={renderType} />
        ) : (
          <div className="survey-form__node-def-entity-table-cell-placeholder">
            <ProgressBar className="progress-bar-striped" progress={100} showText={false} />
          </div>
        )}
      </NodeDefEntityTableCellContent>
    </div>
  )
}

NodeDefEntityTableCell.propTypes = {
  draggable: PropTypes.bool.isRequired, // true if the drag&drop is enabled
  nodeDef: PropTypes.object.isRequired,
  parentNode: PropTypes.object,
  renderType: PropTypes.oneOf([NodeDefLayout.renderType.tableHeader, NodeDefLayout.renderType.tableBody]).isRequired,
  gridSize: PropTypes.shape({
    top: PropTypes.number,
    left: PropTypes.number,
    height: PropTypes.number,
    width: PropTypes.number,
  }), // Coordinates of the grid size where it's contained
  windowed: PropTypes.bool, // Used to load component only when visible in parent grid
  onDragStart: PropTypes.func.isRequired,
  onDragOver: PropTypes.func.isRequired,
  onDragEnd: PropTypes.func.isRequired,
  onResizeStart: PropTypes.func.isRequired,
  onResizeStop: PropTypes.func.isRequired,
  resizable: PropTypes.bool.isRequired,
}

export default NodeDefEntityTableCell
