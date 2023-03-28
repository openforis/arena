import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Node from '@core/record/node'

import { elementOffset } from '@webapp/utils/domUtils'
import { NodeDefsActions, useSurveyCycleKey } from '@webapp/store/survey'

import NodeDeleteButton from '../nodeDeleteButton'
import NodeDefEntityTableCell from './nodeDefEntityTableCell'

const NodeDefEntityTableRow = forwardRef((props, ref) => {
  const {
    edit,
    entry,
    id,
    nodeDef,
    nodeDefColumns,
    node,
    canDelete,
    canEditRecord,
    canEditDef,
    renderType,
    i = 'header',
    siblingEntities,
  } = props

  const placeholderRef = useRef()
  const rowRef = useRef()
  useImperativeHandle(ref, () => rowRef.current)
  const [dragged, setDragged] = useState(null)
  const [resizing, setResizing] = useState(false)

  const dispatch = useDispatch()

  const cycle = useSurveyCycleKey()

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

    setDragged(currentTarget)
  }

  const dragOver = (evt) => {
    if (!draggable) {
      return
    }
    evt.preventDefault()
    const placeholder = placeholderRef.current

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

    dragged.style.display = 'block'
    placeholder.style.display = 'none'

    placeholder.parentNode.insertBefore(dragged, placeholder)
    setDragged(null)

    const childNodes = rowRef.current.childNodes
    const uuids = [...childNodes].map((child) => child.dataset.uuid).filter((uuid) => uuid)

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
    (dragged ? ' drag-in-progress' : '')

  const isChildHidden = (nodeDefChild) => {
    if (!entry) {
      return false
    }
    if (NodeDef.isReadOnly(nodeDefChild) && NodeDef.isHidden(nodeDefChild)) {
      return true
    }
    if (NodeDefLayout.isHiddenWhenNotRelevant(cycle)(nodeDefChild)) {
      const allSiblinNodesNotRelevant = siblingEntities.every(
        (siblingEntity) => !Node.isChildApplicable(nodeDefChild.uuid)(siblingEntity)
      )
      return allSiblinNodesNotRelevant
    }
    return false
  }

  return (
    <div ref={rowRef} className={className} data-testid={id} id={`${NodeDef.getUuid(nodeDef)}_${i}`}>
      {nodeDefColumns
        .filter((nodeDefChild) => !isChildHidden(nodeDefChild))
        .map((nodeDefChild) => {
          return (
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
          )
        })}

      {
        // placeholder used for drag&drop (during survey editing)
        edit && <div className="react-grid-item" style={{ width: '100px', display: 'none' }} ref={placeholderRef} />
      }

      {
        // header for delete column (visible only in data entry)
        entry &&
          renderType === NodeDefLayout.renderType.tableHeader &&
          canEditRecord &&
          !NodeDef.isEnumerate(nodeDef) && (
            <div className="react-grid-item survey-form__node-def-table-cell-header" style={{ width: '26px' }} />
          )
      }

      {renderType === NodeDefLayout.renderType.tableBody && canEditRecord && !NodeDef.isEnumerate(nodeDef) && (
        <NodeDeleteButton nodeDef={nodeDef} node={node} disabled={!canDelete} />
      )}
    </div>
  )
})

NodeDefEntityTableRow.propTypes = {
  edit: PropTypes.bool.isRequired,
  entry: PropTypes.bool.isRequired,
  id: PropTypes.string.isRequired,
  nodeDef: PropTypes.object.isRequired,
  nodeDefColumns: PropTypes.array,
  node: PropTypes.object,
  canDelete: PropTypes.bool,
  canEditDef: PropTypes.bool.isRequired,
  canEditRecord: PropTypes.bool.isRequired,
  renderType: PropTypes.string.isRequired,
  i: PropTypes.any,
  siblingEntities: PropTypes.array,
}

NodeDefEntityTableRow.defaultProps = {
  nodeDefColumns: [],
  node: null,
  i: 'header',
  canDelete: true,
}

export default NodeDefEntityTableRow
