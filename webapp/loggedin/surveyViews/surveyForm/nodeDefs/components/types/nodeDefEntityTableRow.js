import React, { useState, useRef } from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { elementOffset } from '@webapp/utils/domUtils'
import NodeDeleteButton from '../nodeDeleteButton'
import NodeDefEntityTableCell from './nodeDefEntityTableCell'
import { useDispatch } from 'react-redux'
import { useActions } from '@webapp/loggedin/surveyViews/nodeDef/store/actions'

const NodeDefEntityTableRow = (props) => {
  const { edit, nodeDef, nodeDefColumns, node, canEditRecord, canEditDef, renderType, i = 'header', removeNode } = props

  const placeholderRef = useRef()
  const placeholder = placeholderRef.current
  const rowRef = useRef()
  const [dragged, setDragged] = useState(null)

  const dispatch = useDispatch()
  const { putNodeDefLayoutProp } = useActions({})

  const dragStart = (evt) => {
    const { currentTarget, dataTransfer } = evt

    placeholder.style.width = `${currentTarget.clientWidth}px`
    placeholder.style.height = `${currentTarget.clientHeight}px`

    dataTransfer.effectAllowed = 'move'
    // Firefox requires dataTransfer data to be set
    dataTransfer.setData('text/html', currentTarget)

    setDragged(currentTarget)
  }

  const dragOver = (evt) => {
    evt.preventDefault()

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
    dragged.style.display = 'block'
    placeholder.style.display = 'none'

    placeholder.parentNode.insertBefore(dragged, placeholder)
    setDragged(null)

    const childNodes = rowRef.current.childNodes
    const uuids = [...childNodes].map((child) => child.dataset.uuid).filter((uuid) => uuid)

    dispatch(putNodeDefLayoutProp({ nodeDef, key: NodeDefLayout.keys.layoutChildren, value: uuids }))
  }

  const className =
    'survey-form__node-def-entity-table-row' +
    (renderType === NodeDefLayout.renderType.tableHeader ? '-header' : '') +
    (dragged ? ' drag-in-progress' : '')

  return (
    <div ref={rowRef} className={className} id={`${NodeDef.getUuid(nodeDef)}_${i}`}>
      {nodeDefColumns.map((nodeDefChild) => (
        <NodeDefEntityTableCell
          key={NodeDef.getUuid(nodeDefChild)}
          {...props}
          nodeDef={nodeDefChild}
          parentNode={node}
          canEditDef={canEditDef}
          renderType={renderType}
          onDragStart={(e) => dragStart(e)}
          onDragOver={(e) => dragOver(e)}
          onDragEnd={(e) => dragEnd(e)}
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
