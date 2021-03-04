import React, { useState, useRef } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { elementOffset } from '@webapp/utils/domUtils'
import { NodeDefsActions } from '@webapp/store/survey'

import NodeDeleteButton from '../nodeDeleteButton'
import NodeDefEntityTableCell from './nodeDefEntityTableCell'

const NodeDefEntityTableRow = (props) => {
  const {
    edit,
    id,
    nodeDef,
    nodeDefColumns,
    node,
    canEditRecord,
    canEditDef,
    renderType,
    i = 'header',
    removeNode,
  } = props

  const draggable = edit && canEditDef

  const placeholderRef = useRef()
  const rowRef = useRef()
  const [dragged, setDragged] = useState(null)

  const dispatch = useDispatch()

  const dragStart = (evt) => {
    if (!draggable) {
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

  const className =
    'survey-form__node-def-entity-table-row' +
    (renderType === NodeDefLayout.renderType.tableHeader ? '-header' : '') +
    (dragged ? ' drag-in-progress' : '')

  return (
    <div ref={rowRef} className={className} data-testid={id} id={`${NodeDef.getUuid(nodeDef)}_${i}`}>
      {nodeDefColumns.map((nodeDefChild) => (
        <NodeDefEntityTableCell
          key={NodeDef.getUuid(nodeDefChild)}
          {...props}
          nodeDef={nodeDefChild}
          parentNode={node}
          draggable={draggable}
          renderType={renderType}
          onDragStart={dragStart}
          onDragOver={dragOver}
          onDragEnd={dragEnd}
        />
      ))}

      {edit && <div className="react-grid-item" style={{ width: 100 + 'px', display: 'none' }} ref={placeholderRef} />}

      {renderType === NodeDefLayout.renderType.tableBody && canEditRecord && (
        <NodeDeleteButton nodeDef={nodeDef} node={node} removeNode={removeNode} />
      )}
    </div>
  )
}

NodeDefEntityTableRow.propTypes = {
  edit: PropTypes.bool.isRequired,
  nodeDef: PropTypes.object.isRequired,
  nodeDefColumns: PropTypes.array,
  node: PropTypes.object,
  canEditDef: PropTypes.bool.isRequired,
  canEditRecord: PropTypes.bool.isRequired,
  renderType: PropTypes.string.isRequired,
  i: PropTypes.any,
  removeNode: PropTypes.func,
}

NodeDefEntityTableRow.defaultProps = {
  nodeDefColumns: [],
  node: null,
  i: 'header',
  removeNode: null,
}

export default NodeDefEntityTableRow
