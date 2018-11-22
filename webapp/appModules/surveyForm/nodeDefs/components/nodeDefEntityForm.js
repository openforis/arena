import '../../style/react-grid-layout.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { Responsive, WidthProvider } from 'react-grid-layout'
import NodeDefSwitch from '../nodeDefSwitch'

const ResponsiveGridLayout = WidthProvider(Responsive)

import NodeDef from '../../../../../common/survey/nodeDef'
import { newNode } from '../../../../../common/record/node'

import {
  nodeDefLayoutProps,
  filterInnerPageChildren,
  getLayout,
  getNoColumns,
} from '../../../../../common/survey/nodeDefLayout'
import { getFormPageNodeUUID, getSurveyForm } from '../../../../appModules/surveyForm/surveyFormState'

import { setFormPageNode } from '../../actions'

const EntityForm = props => {
  const {
    nodeDef,
    childDefs,
    edit,
    locked,
    node,
    putNodeDefProp,
    entry,
    recordId,
    surveyInfo
  } = props

  const columns = getNoColumns(nodeDef)
  const rdgLayout = getLayout(nodeDef)
  const innerPageChildren = filterInnerPageChildren(childDefs)

  const onLayoutChange = (layout) => {

    //console.log(window.innerWidth) ||
    edit && !locked && window.innerWidth > 1200 && layout.length > 0
    && layout.length === innerPageChildren.length
      ? putNodeDefProp(nodeDef, nodeDefLayoutProps.layout, layout)
      : null
  }

  return (
    innerPageChildren.length > 0
      ? <ResponsiveGridLayout breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}}
                              autoSize={false}
                              rowHeight={edit ? 80 : 50}
                              cols={{lg: columns, md: columns, sm: columns, xs: 1, xxs: 1}}
                              layouts={{lg: rdgLayout, md: rdgLayout, sm: rdgLayout}}
                              containerPadding={[20, 50]}
                              onLayoutChange={onLayoutChange}
                              isDraggable={edit && !locked}
                              isResizable={edit && !locked}
        //TODO decide if verticalCompact
                              compactType={'vertical'}
                              useCSSTransforms={false}>

        {
          innerPageChildren
            .map((childDef, i) =>
              <div key={childDef.uuid} id={childDef.uuid}>
                <NodeDefSwitch key={i}
                               edit={edit}
                               entry={entry}
                               recordId={recordId}
                               surveyInfo={surveyInfo}
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
    updateNode, removeNode, onChange,
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
                const entity = newNode(nodeDef.id, parentNode.recordId, parentNode.uuid)
                updateNode(nodeDef, entity)
                onChange(entity.uuid)
              }}>
        <span className="icon icon-plus icon-16px icon-left"></span>
        ADD
      </button>

    </div>
  )
}

class NodeDefEntityForm extends React.Component {

  getNode (nodeUUID) {
    const {nodes} = this.props
    return nodeUUID
      ? R.find(R.propEq('uuid', nodeUUID), nodes)
      : null
  }

  checkNodePage () {
    const {nodeDef, setFormPageNode, nodes, entry} = this.props

    if (entry && !NodeDef.isNodeDefMultiple(nodeDef)) {
      const nodeUUID = R.pipe(
        R.head,
        R.prop('uuid')
      )(nodes)

      setFormPageNode(nodeDef, nodeUUID)
    }
  }

  componentDidMount () {
    this.checkNodePage()
  }

  componentDidUpdate (prevProps, prevState) {
    const {nodeDef} = this.props
    const {nodeDef: prevNodeDef} = prevProps
    if (nodeDef.uuid !== prevNodeDef.uuid)
      this.checkNodePage()
  }

  render () {
    const {
      nodeDef,
      edit,
      entry,
      nodes,

      setFormPageNode,
      selectedNodeUUID,
    } = this.props

    // edit survey mode
    if (edit)
      return <EntityForm {...this.props} />

    // entry multiple entity
    if (entry && NodeDef.isNodeDefMultiple(nodeDef)) {
      const node = this.getNode(selectedNodeUUID)

      return <div>

        <NodeSelect {...this.props}
                    selectedNode={node}
                    onChange={selectedNodeUUID => setFormPageNode(nodeDef, selectedNodeUUID)}/>

        {
          node
            ? <EntityForm {...this.props} node={node}/>
            : null
        }
      </div>
    }

    // entry single entity
    if (entry && !NodeDef.isNodeDefMultiple(nodeDef))
      return <EntityForm {...this.props}
                         node={nodes[0]}/>

    return null
  }
}

const mapStateToProps = (state, props) => ({
  selectedNodeUUID: getFormPageNodeUUID(props.nodeDef)(getSurveyForm(state))
})

export default connect(
  mapStateToProps,
  {setFormPageNode}
)(NodeDefEntityForm)