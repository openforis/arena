import './nodeDefEntityTableRow.scss'

import React from 'react'

import NodeDefSwitch from '../../nodeDefSwitch'
import NodeDeleteButton from '../nodeDeleteButton'

import NodeDefLayout from '../../../../../../../common/survey/nodeDefLayout'
import * as NodeDefUiProps from '../../nodeDefSystemProps'

import NodeDef from '../../../../../../../common/survey/nodeDef'

import { elementOffset } from '../../../../../../../webapp/utils/domUtils'

class NodeDefEntityTableRow extends React.Component {
  constructor (props) {
    super(props)

    this.placeholderRef = React.createRef()
    this.rowRef = React.createRef()
    this.state = { dragged: null }
  }

  dragStart (evt) {
    this.setState({ dragged: evt.currentTarget }, () => {
      const { dragged } = this.state
      const placeholder = this.placeholderRef.current

      placeholder.style.width = `${dragged.clientWidth}px`
      placeholder.style.height = `${dragged.clientHeight}px`
    })

    evt.dataTransfer.effectAllowed = 'move'
    // Firefox requires dataTransfer data to be set
    evt.dataTransfer.setData('text/html', evt.currentTarget)
  }

  dragOver (evt) {
    const { dragged } = this.state
    const placeholder = this.placeholderRef.current

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

  dragEnd () {
    const { nodeDef, putNodeDefProp } = this.props

    const { dragged } = this.state
    const placeholder = this.placeholderRef.current

    dragged.style.display = 'block'
    placeholder.style.display = 'none'

    placeholder.parentNode.insertBefore(dragged, placeholder)
    this.setState({ dragged: null })

    const childNodes = this.rowRef.current.childNodes
    const uuids = [ ...childNodes ].map(node => node.dataset.uuid).filter(uuid => uuid)

    putNodeDefProp(nodeDef, NodeDefLayout.nodeDefLayoutProps.layout, uuids)
  }

  render () {

    const {
      nodeDef, childDefs, node,
      renderType,
      removeNode,
      i = 'header',
      canEditRecord,
      canEditDef,
    } = this.props

    const { dragged } = this.state

    const orderedUuids = NodeDefLayout.getLayout(nodeDef)
    const orderedChildDefs = orderedUuids.map(uuid => childDefs.find(def => def.uuid === uuid)).filter(d => d)

    const className = `node-def__table-row` +
      (renderType === NodeDefLayout.nodeDefRenderType.tableHeader ? '-header' : '') +
      (dragged ? ' drag-in-progress' : '')

    return (
      <div ref={this.rowRef}
           className={className}
           id={`${NodeDef.getUuid(nodeDef)}_${i}`}>

        {
          orderedChildDefs
            .map(childDef => {
              const { length } = NodeDefUiProps.getNodeDefFormFields(childDef)
              const childDefUuid = NodeDef.getUuid(childDef)

              return (
                <div key={childDefUuid}
                     data-uuid={childDefUuid}
                     className="react-grid-item draggable-item"
                     style={{ width: 160 * length + 'px' }}
                     onMouseDown={e => e.stopPropagation()}
                     draggable={canEditDef}
                     onDragStart={e => this.dragStart(e)}
                     onDragOver={e => this.dragOver(e)}
                     onDragEnd={e => this.dragEnd(e)}>
                  <NodeDefSwitch {...this.props}
                                 node={null}
                                 nodeDef={childDef}
                                 parentNode={node}
                                 renderType={renderType}/>
                </div>
              )
            })
        }

        <div className="react-grid-item" style={{ width: 100 + 'px', display: 'none' }} ref={this.placeholderRef} />

        {
          renderType === NodeDefLayout.nodeDefRenderType.tableBody && canEditRecord &&
          <NodeDeleteButton nodeDef={nodeDef}
                            node={node}
                            removeNode={removeNode}/>
        }

      </div>
    )

  }
}

export default NodeDefEntityTableRow