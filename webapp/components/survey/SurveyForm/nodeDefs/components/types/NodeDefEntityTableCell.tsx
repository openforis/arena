import { type ReactNode, useEffect, useRef, useState } from 'react'
import { ResizableBox } from 'react-resizable'

import type { ArenaAnyNodeDef, ArenaRecordNode } from '@openforis/arena-core'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import ProgressBar from '@webapp/components/ProgressBar'
import { useAppDispatch } from '@webapp/store'
import { NodeDefsActions, useSurveyCycleKey } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'
import NodeDefSwitch from '../../NodeDefSwitch'
import * as NodeDefUiProps from '../../nodeDefUIProps'

type NodeDefEntityTableCellContentProps = {
  children: ReactNode
  fieldsLength: number
  height?: number
  nodeDef: ArenaAnyNodeDef
  onResizeStart: (...args: any[]) => any
  onResizeStop: (...args: any[]) => any
  resizable: boolean
  width: number
}

const NodeDefEntityTableCellContent = (props: NodeDefEntityTableCellContentProps) => {
  const { children, fieldsLength, height, nodeDef, onResizeStart, onResizeStop, resizable, width } = props

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
      height={height}
      axis="x"
      handleSize={[25, 25]}
      onResizeStart={onResizeStart}
      onResizeStop={onResizeStop}
      minConstraints={[NodeDefLayout.columnWidthMinPx * fieldsLength, height]}
      maxConstraints={[NodeDefLayout.columnWidthMaxPx * fieldsLength, height]}
    >
      {children}
    </ResizableBox>
  )
}

type NodeDefEntityTableCellProps = {
  columnHeaderHeight?: number
  draggable: boolean // true if the drag&drop is enabled
  nodeDef: ArenaAnyNodeDef
  parentNode?: ArenaRecordNode
  renderType: any
  gridSize?: {
    top?: number
    left?: number
    height?: number
    width?: number
  } // Coordinates of the grid size where it's contained
  windowed?: boolean // Used to load component only when visible in parent grid
  onDragStart: (...args: any[]) => any
  onDragOver: (...args: any[]) => any
  onDragEnd: (...args: any[]) => any
  onResizeStart: (...args: any[]) => any
  onResizeStop: (...args: any[]) => any
  resizable: boolean
}

const NodeDefEntityTableCell = (props: NodeDefEntityTableCellProps) => {
  const {
    columnHeaderHeight = null,
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
  const dispatch = useAppDispatch()

  // Table cell header is always visible
  const isHeader = renderType === NodeDefLayout.renderType.tableHeader
  const [visible, setVisible] = useState(isHeader || !windowed)

  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  const fieldsLength = NodeDefUiProps.getFormFieldsLength(nodeDef)
  const widthValue = NodeDefLayout.getColumnWidthValue(cycle)(nodeDef)
  const totalWidthValue = fieldsLength * Number(widthValue)

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
      className="react-grid-item draggable-item survey-form__node-def-entity-table-cell"
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <NodeDefEntityTableCellContent
        fieldsLength={fieldsLength}
        height={columnHeaderHeight ?? undefined}
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

export default NodeDefEntityTableCell
