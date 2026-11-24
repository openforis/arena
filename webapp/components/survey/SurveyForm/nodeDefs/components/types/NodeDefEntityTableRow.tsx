import { useState, useRef, useImperativeHandle, forwardRef } from 'react'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { elementOffset } from '@webapp/utils/domUtils'
import { NodeDefsActions, useSurveyCycleKey } from '@webapp/store/survey'
import { useRecord } from '@webapp/store/ui/record'
import { isChildHiddenWhenNotRelevant } from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefChildVisibility'

import NodeDeleteButton from '../NodeDeleteButton'
import NodeDefEntityTableCell from './NodeDefEntityTableCell'
import { useAppDispatch } from '@webapp/store'
import type { ArenaAnyNodeDef, ArenaRecordNode } from '@openforis/arena-core'

type NodeDefEntityTableRowProps = {
  edit: boolean
  entry: boolean
  id: string
  nodeDef: ArenaAnyNodeDef
  nodeDefColumns?: any[]
  node?: ArenaRecordNode
  canDelete?: boolean
  canEditDef: boolean
  canEditRecord: boolean
  renderType: string
  i?: any
  siblingEntities?: any[]
  // other props are passed through to the cells
  [key: string]: any
}

const NodeDefEntityTableRow = forwardRef((props: NodeDefEntityTableRowProps, ref) => {
  const {
    canDelete = true,
    canEditDef,
    edit,
    entry,
    i = 'header',
    id,
    node = null,
    nodeDef,
    nodeDefColumns = [],
    renderType,
    siblingEntities,
  } = props

  const placeholderRef = useRef<HTMLDivElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const draggedRef = useRef<HTMLElement>(null)
  useImperativeHandle(ref, () => rowRef.current)
  const [dragInProgress, setDragInProgress] = useState(false)
  const [resizing, setResizing] = useState(false)

  const dispatch = useAppDispatch()

  const cycle = useSurveyCycleKey()
  const record = useRecord()

  const draggable = edit && canEditDef && !resizing
  const resizable = edit && renderType === NodeDefLayout.renderType.tableHeader

  const dragStart = (evt) => {
    if (!draggable || resizing) {
      return
    }
    const { currentTarget, dataTransfer } = evt
    const placeholder = placeholderRef.current

    placeholder.style.width = `${currentTarget.clientWidth}px`
    placeholder.style.height = `${currentTarget.clientHeight}px`

    dataTransfer.effectAllowed = 'move'
    // Firefox requires dataTransfer data to be set
    dataTransfer.setData('text/html', currentTarget)

    draggedRef.current = currentTarget
    setDragInProgress(true)
  }

  const dragOver = (evt) => {
    if (!draggable) {
      return
    }
    evt.preventDefault()
    const placeholder = placeholderRef.current
    const dragged = draggedRef.current

    if (!dragged) {
      return
    }

    dragged.style.display = 'none'
    placeholder.style.display = 'block'

    if (evt.target !== placeholder) {
      const overElement = evt.target

      const { left } = elementOffset(overElement)
      const relX = evt.clientX - left
      const width = overElement.offsetWidth / 2
      const parent = evt.target.parentNode

      parent.insertBefore(placeholder, relX > width ? evt.target.nextElementSibling : evt.target)
    }
  }

  const dragEnd = () => {
    if (!draggable) {
      return
    }
    const placeholder = placeholderRef.current
    const dragged = draggedRef.current

    if (!dragged) {
      return
    }

    dragged.style.display = 'block'
    placeholder.style.display = 'none'

    // insert dragged element in place of placeholder
    placeholder.parentNode.insertBefore(dragged, placeholder)

    draggedRef.current = null
    setDragInProgress(false)

    const childNodes = rowRef.current.childNodes
    const uuids = [...childNodes].map((child) => (child as HTMLElement).dataset.uuid).filter(Boolean)

    dispatch(NodeDefsActions.putNodeDefLayoutProp({ nodeDef, key: NodeDefLayout.keys.layoutChildren, value: uuids }))
  }

  const onChildResizeStart = () => {
    setResizing(true)
  }

  const onChildResizeStop = () => {
    setResizing(false)
  }

  const className =
    'survey-form__node-def-entity-table-row' +
    (renderType === NodeDefLayout.renderType.tableHeader ? '-header' : '') +
    (dragInProgress ? ' drag-in-progress' : '')

  const isChildHidden = (nodeDefChild) => {
    if (!entry) {
      return false
    }
    if (NodeDef.isReadOnly(nodeDefChild) && NodeDef.isHidden(nodeDefChild)) {
      return true
    }
    // column hidden only when the field is not relevant and empty in every row
    return (
      NodeDefLayout.isHiddenWhenNotRelevant(cycle)(nodeDefChild) &&
      siblingEntities.every((siblingEntity) =>
        isChildHiddenWhenNotRelevant({ cycle, record, parentNode: siblingEntity, childDef: nodeDefChild })
      )
    )
  }

  return (
    <div ref={rowRef} className={className} data-testid={id} id={`${NodeDef.getUuid(nodeDef)}_${i}`}>
      {nodeDefColumns
        .filter((nodeDefChild) => !isChildHidden(nodeDefChild))
        .map((nodeDefChild) => (
          <NodeDefEntityTableCell
            key={nodeDefChild.uuid}
            {...props}
            nodeDef={nodeDefChild}
            parentNode={node}
            draggable={draggable}
            renderType={renderType}
            resizable={resizable}
            onDragStart={dragStart}
            onDragOver={dragOver}
            onDragEnd={dragEnd}
            onResizeStart={onChildResizeStart}
            onResizeStop={onChildResizeStop}
          />
        ))}

      {
        // placeholder used for drag&drop (during survey editing)
        edit && <div className="react-grid-item" style={{ width: '100px', display: 'none' }} ref={placeholderRef} />
      }

      {
        // header for delete column (visible only in data entry)
        entry && renderType === NodeDefLayout.renderType.tableHeader && canDelete && (
          <div className="react-grid-item survey-form__node-def-table-cell-header" style={{ width: '26px' }} />
        )
      }

      {renderType === NodeDefLayout.renderType.tableBody && canDelete && (
        <NodeDeleteButton nodeDef={nodeDef} node={node} disabled={!canDelete} />
      )}
    </div>
  )
})

export default NodeDefEntityTableRow
