import './nodeDefEntityForm.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { Responsive, WidthProvider } from 'react-grid-layout'
import NodeDefSwitch from '../../nodeDefSwitch'

import NodeDef from '../../../../../../common/survey/nodeDef'
import Node from '../../../../../../common/record/node'

import {
  nodeDefLayoutProps,
  filterInnerPageChildren,
  getLayout,
  getNoColumns,
} from '../../../../../../common/survey/nodeDefLayout'

import { setFormPageNode, getNodeKeyLabelValues } from '../../../actions'

import * as SurveyFormState from '../../../../../appModules/surveyForm/surveyFormState'

const ResponsiveGridLayout = WidthProvider(Responsive)

const EntityForm = props => {
  const {
    nodeDef,
    childDefs,
    edit,
    canEditDef,
    canEditRecord,
    locked,
    node,
    putNodeDefProp,
    entry,
    recordUuid,
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
      ? <ResponsiveGridLayout breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                              autoSize={false}
                              rowHeight={edit ? 80 : 50}
                              cols={{ lg: columns, md: columns, sm: columns, xs: 1, xxs: 1 }}
                              layouts={{ lg: rdgLayout, md: rdgLayout, sm: rdgLayout }}
                              containerPadding={edit ? [40, 30] : [30, 30]}
                              onLayoutChange={onLayoutChange}
                              isDraggable={edit && !locked}
                              isResizable={edit && !locked}
                              compactType={null}
                              useCSSTransforms={false}>

        {
          innerPageChildren
            .map((childDef, i) =>
              <div key={childDef.uuid} id={childDef.uuid}>
                <NodeDefSwitch key={i}
                               edit={edit}
                               entry={entry}
                               recordUuid={recordUuid}
                               surveyInfo={surveyInfo}
                               nodeDef={childDef}
                               parentNode={node}
                               canEditDef={canEditDef}
                               canEditRecord={canEditRecord}/>
              </div>
            )
        }

      </ResponsiveGridLayout>
      : null
  )
}

const NodeSelect = props => {
  const {
    nodeDef, nodes, parentNode, selectedNode, getNodeKeyLabelValues,
    updateNode, removeNode, onChange, canEditRecord
  } = props

  return (
    <div className="node-def-entity-form__actions">

      <select className="node-select"
              value={selectedNode ? selectedNode.uuid : 'placeholder'}
              onChange={e => onChange(e.target.value)}
              aria-disabled={R.isEmpty(nodes)}>
        <option value='placeholder' disabled hidden={true}>Select</option>
        {
          nodes.map(n =>
            <option key={Node.getUuid(n)}
                    value={Node.getUuid(n)}>
              {getNodeKeyLabelValues(n)}
            </option>
          )
        }
      </select>

      {
        canEditRecord &&
        <React.Fragment>
          <button className="btn btn-s btn-of-light-xs"
                  style={{ marginLeft: '5px' }}
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
                  style={{ marginLeft: '50px' }}
                  onClick={() => {
                    const entity = Node.newNode(nodeDef.uuid, parentNode.recordUuid, parentNode.uuid)
                    updateNode(nodeDef, entity)
                    onChange(entity.uuid)
                  }}>
            <span className="icon icon-plus icon-16px icon-left"></span>
            ADD
          </button>
        </React.Fragment>
      }
    </div>
  )
}

class NodeDefEntityForm extends React.Component {

  checkNodePage () {
    const { nodeDef, setFormPageNode, nodes, entry } = this.props

    if (entry && !NodeDef.isNodeDefMultiple(nodeDef)) {
      const nodeUuid = R.pipe(
        R.head,
        R.prop('uuid')
      )(nodes)

      setFormPageNode(nodeDef, nodeUuid)
    }
  }

  componentDidMount () {
    this.checkNodePage()
  }

  componentDidUpdate (prevProps, prevState) {
    const { nodeDef } = this.props
    const { nodeDef: prevNodeDef } = prevProps
    if (NodeDef.getUuid(nodeDef) !== NodeDef.getUuid(prevNodeDef))
      this.checkNodePage()
  }

  render () {
    const {
      nodeDef,
      edit,
      entry,
      nodes,

      setFormPageNode,
      selectedNode,
      getNodeKeyLabelValues,
    } = this.props

    return entry && NodeDef.isNodeDefMultiple(nodeDef)
      ? (
        <div className="node-def-entity-form__wrapper">
          <NodeSelect {...this.props}
                      selectedNode={selectedNode}
                      getNodeKeyLabelValues={getNodeKeyLabelValues}
                      onChange={selectedNodeUuid => setFormPageNode(nodeDef, selectedNodeUuid)}/>

          {
            selectedNode
              ? <EntityForm {...this.props} node={selectedNode}/>
              : null
          }
        </div>
      )
      : (
        <EntityForm {...this.props} node={entry ? nodes[0] : null}/>
      )

  }
}

const mapStateToProps = (state, props) => {
  const { nodeDef, nodes } = props

  const surveyForm = SurveyFormState.getSurveyForm(state)
  const selectedNodeUuid = SurveyFormState.getFormPageNodeUuid(nodeDef)(surveyForm)
  const selectedNode = selectedNodeUuid && nodes
    ? R.find(R.propEq('uuid', selectedNodeUuid), nodes)
    : null

  return {
    selectedNode,
  }
}

export default connect(
  mapStateToProps,
  { setFormPageNode, getNodeKeyLabelValues }
)(NodeDefEntityForm)