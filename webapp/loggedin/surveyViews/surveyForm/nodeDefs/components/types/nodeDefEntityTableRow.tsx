import React from 'react'

import { NodeDefEntityTableCell } from '../../internal'
import { NodeDeleteButton } from '../../internal'

import NodeDef from '../../../../../../../core/survey/nodeDef'
import NodeDefLayout from '../../../../../../../core/survey/nodeDefLayout'

import { elementOffset } from '../../../../../../../webapp/utils/domUtils'

export class NodeDefEntityTableRow extends React.Component {
	public placeholderRef: React.RefObject<any>;
	public rowRef: React.RefObject<any>;

  constructor (props: Readonly<{}>) {
    super(props)

    this.placeholderRef = React.createRef()
    this.rowRef = React.createRef()
    this.state = { dragged: null }
  }

  dragStart (evt: React.DragEvent<Element>) {
    this.setState({ dragged: evt.currentTarget }, () => {
      const { dragged } = this.state
      const placeholder = this.placeholderRef.current

      placeholder.style.width = `${dragged.clientWidth}px`
      placeholder.style.height = `${dragged.clientHeight}px`
    })

    evt.dataTransfer.effectAllowed = 'move'
    // Firefox requires dataTransfer data to be set
    evt.dataTransfer.setData('text/html', evt.currentTarget as any)
  }

  dragOver (evt: React.DragEvent<Element>) {
    const { dragged } = this.state
    const placeholder = this.placeholderRef.current

    evt.preventDefault()

    dragged.style.display = 'none'
    placeholder.style.display = 'block'

    if (evt.target !== placeholder) {
      const overElement = evt.target as HTMLElement

      const { left } = elementOffset(overElement)
      const relX = evt.clientX - left
      const width = overElement.offsetWidth / 2
      const parent = overElement.parentNode

      parent.insertBefore(placeholder, relX > width ? overElement.nextElementSibling : overElement)
    }
  }

  dragEnd (_evt: React.DragEvent<Element>) {
    const { nodeDef, putNodeDefLayoutProp } = this.props

    const { dragged } = this.state
    const placeholder = this.placeholderRef.current

    dragged.style.display = 'block'
    placeholder.style.display = 'none'

    placeholder.parentNode.insertBefore(dragged, placeholder)
    this.setState({ dragged: null })

    const childNodes = this.rowRef.current.childNodes
    const uuids = [...childNodes].map(node => node.dataset.uuid).filter(uuid => uuid)

    putNodeDefLayoutProp(nodeDef, NodeDefLayout.keys.layoutChildren, uuids)
  }

  render () {

    const {
      edit, nodeDef, nodeDefColumns, node,
      canEditRecord, canEditDef,
      renderType, i = 'header',
      removeNode,
    } = this.props

    const { dragged } = this.state

    const className = `survey-form__node-def-entity-table-row` +
      (renderType === NodeDefLayout.renderType.tableHeader ? '-header' : '') +
      (dragged ? ' drag-in-progress' : '')

    return (
      <div ref={this.rowRef}
           className={className}
           id={`${NodeDef.getUuid(nodeDef)}_${i}`}>

        {
          nodeDefColumns
            .map((nodeDefChild: any) => (
              <NodeDefEntityTableCell
                key={NodeDef.getUuid(nodeDefChild)}
                {...this.props}
                nodeDef={nodeDefChild}
                parentNode={node}
                canEditDef={canEditDef}
                renderType={renderType}
                onDragStart={(e: React.DragEvent<Element>) => this.dragStart(e)}
                onDragOver={(e: React.DragEvent<Element>) => this.dragOver(e)}
                onDragEnd={(e: React.DragEvent<Element>) => this.dragEnd(e)}
              />
            ))
        }

        {
          edit &&
          <div
            className="react-grid-item"
            style={{ width: 100 + 'px', display: 'none' }}
            ref={this.placeholderRef}
          />
        }

        {
          renderType === NodeDefLayout.renderType.tableBody && canEditRecord &&
          <NodeDeleteButton
            nodeDef={nodeDef}
            node={node}
            removeNode={removeNode}
          />
        }

      </div>
    )

  }
}

export default NodeDefEntityTableRow
