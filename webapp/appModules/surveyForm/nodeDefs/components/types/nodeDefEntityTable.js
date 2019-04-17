import './nodeDefEntityTable.scss'
import '../../../style/react-grid-layout.scss'

import React from 'react'
import * as R from 'ramda'

import NodeDefSwitch from '../../nodeDefSwitch'
import NodeDeleteButton from '../nodeDeleteButton'

import { nodeDefRenderType } from '../../../../../../common/survey/nodeDefLayout'
import { getNodeDefFormFields } from '../../nodeDefSystemProps'

import NodeDef from '../../../../../../common/survey/nodeDef'
import Node from '../../../../../../common/record/node'

import { elementOffset } from '../../../../../appUtils/domUtils'

class EntityTableRow extends React.Component {
  constructor (props) {
    super(props)

    this.placeholderRef = React.createRef()
    this.rowRef = React.createRef()
    this.state = { dragged: null }
  }

  dragStart (e) {
    this.setState({ dragged: e.currentTarget }, () => {
      const { dragged } = this.state

      this.placeholderRef.current.style.width = `${dragged.clientWidth}px`
      this.placeholderRef.current.style.height = `${dragged.clientHeight}px`
    })

    e.dataTransfer.effectAllowed = 'move'
    // Firefox requires dataTransfer data to be set
    e.dataTransfer.setData('text/html', e.currentTarget)
  }

  dragEnd (e) {
    const { dragged } = this.state
    const placeholder = this.placeholderRef.current

    dragged.style.display = 'block'
    placeholder.style.display = 'none'

    placeholder.parentNode.insertBefore(dragged, placeholder)
    this.setState({ dragged: null })

    const uuids = []
    this.rowRef.current.childNodes.forEach(childNode => {
      const uuid = childNode.dataset.uuid
      if (uuid) {
        uuids.push(uuid)
      }
    })
    console.log(uuids)
  }

  dragOver (e) {
    const { dragged } = this.state
    const placeholder = this.placeholderRef.current

    e.preventDefault()

    dragged.style.display = 'none'
    placeholder.style.display = 'block'

    if (e.target === placeholder) {
      return
    }

    const overElement = e.target

    const { left } = elementOffset(overElement)
    const relX = e.clientX - left
    const width = overElement.offsetWidth / 2
    const parent = e.target.parentNode

    if (relX > width) {
      parent.insertBefore(placeholder, e.target.nextElementSibling)
    } else if (relX < width) {
      parent.insertBefore(placeholder, e.target)
    }
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

    const className = `node-def__table-row` +
      (renderType === nodeDefRenderType.tableHeader ? '-header' : '') +
      (dragged ? ' drag-in-progress' : '')

    return (
      <div ref={this.rowRef}
           className={className}
           id={`${NodeDef.getUuid(nodeDef)}_${i}`}>

        {
          childDefs
            .map(childDef => {
              const { length } = getNodeDefFormFields(childDef)
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
          renderType === nodeDefRenderType.tableBody && canEditRecord &&
          <NodeDeleteButton nodeDef={nodeDef}
                            node={node}
                            removeNode={removeNode}/>
        }

      </div>
    )

  }
}

class NodeDefEntityTable extends React.Component {

  componentDidUpdate (prevProps) {
    const { nodes, nodeDef } = this.props
    const { nodes: prevNodes } = prevProps

    if (nodes && !R.isEmpty(nodes) && nodes.length !== prevNodes.length) {
      const element = document.getElementById(`${NodeDef.getUuid(nodeDef)}_${nodes.length - 1}`)
      element.scrollIntoView()
    }
  }

  render () {
    const {
      entry,
      edit,
      nodeDef,
      nodes,
      parentNode,
      label,
      updateNode,
      canEditRecord,
      canAddNode,
    } = this.props

    return (
      <div className="node-def__table">

        <div className="node-def__table-header">
          <div>{label}</div>
          {
            entry && canEditRecord
              ? <button className="btn btn-s btn-of-light-xs"
                        style={{ marginLeft: '10px' }}
                        onClick={() => {
                          const entity = Node.newNodePlaceholder(nodeDef, parentNode)
                          updateNode(nodeDef, entity)
                        }}
                        aria-disabled={!canAddNode}>
                <span className="icon icon-plus icon-12px icon-left"/>
                ADD
              </button>
              : null
          }
        </div>


        <div className="node-def__table-rows">
          {
            edit || !R.isEmpty(nodes) ?

              <EntityTableRow {...this.props}
                              node={null}
                              renderType={nodeDefRenderType.tableHeader}/>
              : null
          }

          {
            entry ?
              R.isEmpty(nodes)
                ? <h5><i>No data added</i></h5>
                : (
                  <div className="node-def__table-data-rows">
                    {nodes.map((node, i) =>
                      <EntityTableRow key={i}
                                      i={i}
                                      {...this.props}
                                      node={node}
                                      nodes={null}
                                      renderType={nodeDefRenderType.tableBody}/>
                    )}
                  </div>
                )
              : null
          }
        </div>
      </div>
    )
  }
}

export default NodeDefEntityTable