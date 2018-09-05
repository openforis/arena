import '../react-grid-layout.scss'

import React from 'react'
import * as R from 'ramda'

import { Responsive, WidthProvider } from 'react-grid-layout'
import NodeDefSwitch from '../nodeDefSwitch'

const ResponsiveGridLayout = WidthProvider(Responsive)

import { isNodeDefMultiple } from '../../../../../common/survey/nodeDef'
import { newNode } from '../../../../../common/record/node'

import {
  nodeDefLayoutProps,
  filterInnerPageChildren,
  getLayout,
  getNoColumns,
} from '../../../../../common/survey/nodeDefLayout'

const onLayoutChange = (props, layout) => {
  const {nodeDef, edit, locked, putNodeDefProp} = props

//console.log(window.innerWidth) ||
  edit && !locked && window.innerWidth > 1200 && layout.length > 0
    ? putNodeDefProp(nodeDef, nodeDefLayoutProps.layout, layout)
    : null
}

const EntityForm = props => {
  const {nodeDef, childDefs, edit, locked, node} = props

  const columns = getNoColumns(nodeDef)
  const rdgLayout = getLayout(nodeDef)
  const innerPageChildren = filterInnerPageChildren(childDefs)

  const childProps = R.pipe(
    R.dissoc('node'),
    R.dissoc('childDefs'),
    R.dissoc('nodeDef'),
  )(props)

  return (
    childDefs.length > 0
      ? <ResponsiveGridLayout breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}}
                              autoSize={false}
                              rowHeight={edit ? 80 : 60}
                              cols={{lg: columns, md: columns, sm: columns, xs: 1, xxs: 1}}
                              containerPadding={edit ? [20, 50] : [20, 20]}
                              layouts={{
                                lg: rdgLayout,
                                md: rdgLayout,
                                sm: rdgLayout,
                              }}
                              onLayoutChange={(layout) => onLayoutChange(props, layout)}
                              isDraggable={edit && !locked}
                              isResizable={edit && !locked}
        //TODO decide if verticalCompact
                              compactType={'vertical'}>

        {
          innerPageChildren
            .map((childDef, i) =>
              <div key={childDef.uuid}>
                <NodeDefSwitch key={i}
                               {...childProps}
                               nodeDef={childDef}
                               parentNode={node}/>
              </div>
            )
        }

      </ResponsiveGridLayout>
      : null
  )
}

const NodeSelect = props => {
  const {
    nodeDef, nodes, parentNode, selectedNode,
    addNode, removeNode, onChange,
  } = props

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
    }}>

      <select aria-disabled={R.isEmpty(nodes)}
              value={selectedNode ? selectedNode.uuid : 'placeholder'}
              onChange={e => onChange(e.target.value)}>
        <option value='placeholder' disabled hidden={true}>Select</option>
        {
          nodes.map(n =>
            <option key={n.uuid}
                    value={n.uuid}>
              {/*//TODO add key attribute*/}
              {n.uuid}
            </option>
          )
        }
      </select>

      <button className="btn btn-s btn-of-light-xs"
              style={{marginLeft: '5px'}}
              aria-disabled={!selectedNode}
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this entity?')) {
                  onChange(null)
                  removeNode(nodeDef, selectedNode)
                }
              }}>
        <span className="icon icon-bin icon-12px icon-left"/>
        DELETE
      </button>

      <button className="btn btn-s btn-of-light-xs"
              style={{marginLeft: '50px'}}
              onClick={() => {
                const entity = newNode(nodeDef.id, parentNode.recordId, parentNode.id)
                addNode(nodeDef, entity)
                onChange(entity.uuid)
              }}>
        <span className="icon icon-plus icon-16px icon-left"></span>
        ADD
      </button>

    </div>
  )
}

class NodeDefEntityForm extends React.Component {

  constructor () {
    super()
    this.state = {selectedNodeUUID: null}
  }

  getSelectedNode () {
    const {nodes} = this.props
    const {selectedNodeUUID} = this.state
    return selectedNodeUUID
      ? R.find(R.propEq('uuid', selectedNodeUUID), nodes)
      : null
  }

  render () {
    const {
      nodeDef,
      edit,
      entry,
      nodes,
    } = this.props

    // edit survey mode
    if (edit)
      return <EntityForm {...this.props} />

    // entry multiple entity
    if (entry && isNodeDefMultiple(nodeDef)) {
      const node = this.getSelectedNode()

      return <div>

        <NodeSelect {...this.props}
                    selectedNode={node}
                    onChange={selectedNodeUUID => this.setState({selectedNodeUUID})}/>

        {
          node
            ? <EntityForm {...this.props} node={node}/>
            : null
        }
      </div>
    }

    // entry single entity
    if (entry && !isNodeDefMultiple(nodeDef))
      return <EntityForm {...this.props} node={nodes[0]}/>

    return null
  }
}

export default NodeDefEntityForm