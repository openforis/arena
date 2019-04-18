import './nodeDefEntityForm.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { Responsive, WidthProvider } from 'react-grid-layout'
import NodeDefSwitch from '../../nodeDefSwitch'
import NodeDefErrorBadge from '../nodeDefErrorBadge'

import NodeDef from '../../../../../../../common/survey/nodeDef'
import Record from '../../../../../../../common/record/record'
import Node from '../../../../../../../common/record/node'
import Validator from '../../../../../../../common/validation/validator'

import {
  nodeDefLayoutProps,
  filterInnerPageChildren,
  getLayout,
  getNoColumns,
  isRenderForm,
  hasPage,
} from '../../../../../../../common/survey/nodeDefLayout'

import { setFormPageNode, getNodeKeyLabelValues } from '../../../../surveyForm/actions'

import * as SurveyFormState from '../../../../surveyForm/surveyFormState'
import * as RecordState from '../../../../record/recordState'

const ResponsiveGridLayout = WidthProvider(Responsive)

const EntityFormHeader = ({ nodeDef, label }) => (
  isRenderForm(nodeDef) && !hasPage(nodeDef) &&
  <div className="node-def__inner-form-header">
    {label}
  </div>
)

const EntityForm = props => {
  const {
    nodeDef,
    childDefs,
    edit,
    canEditDef,
    canEditRecord,
    canAddNode,
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
    edit && canEditDef && !locked && window.innerWidth > 1200 && layout.length > 0
    && layout.length === innerPageChildren.length
      ? putNodeDefProp(nodeDef, nodeDefLayoutProps.layout, layout)
      : null
  }

  return innerPageChildren.length > 0
    ? (
      <ResponsiveGridLayout
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        autoSize={false}
        rowHeight={edit && canEditDef ? 80 : 50}
        cols={{ lg: columns, md: columns, sm: columns, xs: 1, xxs: 1 }}
        layouts={{ lg: rdgLayout, md: rdgLayout, sm: rdgLayout }}
        containerPadding={edit && canEditDef ? [30, 50] : [30, 30]}
        onLayoutChange={onLayoutChange}
        isDraggable={edit && canEditDef && !locked}
        isResizable={edit && canEditDef && !locked}
        compactType={null}
        useCSSTransforms={false}
        preventCollision={true}>

        {
          innerPageChildren
            .map((childDef, i) =>
              <div key={NodeDef.getUuid(childDef)} id={NodeDef.getUuid(childDef)}
                   className={NodeDef.isEntity(childDef) && isRenderForm(childDef) ? 'node-def__inner-form' : ''}>
                <NodeDefSwitch
                  key={i}
                  edit={edit}
                  entry={entry}
                  recordUuid={recordUuid}
                  surveyInfo={surveyInfo}
                  nodeDef={childDef}
                  parentNode={node}
                  canEditDef={canEditDef}
                  canEditRecord={canEditRecord}
                  canAddNode={canAddNode}/>
              </div>
            )
        }

      </ResponsiveGridLayout>
    )
    : null
}

const NodeSelect = props => {
  const {
    nodeDef, nodes, parentNode, selectedNode, getNodeKeyLabelValues,
    updateNode, removeNode, onChange, canEditRecord, canAddNode
  } = props

  return (
    <div className="node-def-entity-form__actions">

      <select className="node-select"
              value={selectedNode ? Node.getUuid(selectedNode) : 'placeholder'}
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
                    const entity = Node.newNode(NodeDef.getUuid(nodeDef), Node.getRecordUuid(parentNode), parentNode)
                    updateNode(nodeDef, entity)
                    onChange(Node.getUuid(entity))
                  }}
                  aria-disabled={!canAddNode}>
            <span className="icon icon-plus icon-16px icon-left"/>
            ADD
          </button>
        </React.Fragment>
      }
    </div>
  )
}

class NodeDefEntityForm extends React.Component {

  constructor (props) {
    super(props)

    this.formWrapper = new React.createRef()
  }

  checkNodePage () {
    const { nodeDef, setFormPageNode, nodes, entry } = this.props

    if (entry && !NodeDef.isMultiple(nodeDef)) {
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
      nodeDef, label,
      edit, entry,
      parentNode, nodes,

      setFormPageNode,
      selectedNode,
      getNodeKeyLabelValues,
    } = this.props

    return entry && NodeDef.isMultiple(nodeDef)
      ? (
        <div className="node-def-entity-form__wrapper" ref={this.formWrapper}>
          <NodeDefErrorBadge
            nodeDef={nodeDef}
            edit={edit}
            parentNode={parentNode}
            nodes={nodes}
            container={this.formWrapper}/>

          <EntityFormHeader
            nodeDef={nodeDef}
            label={label}/>

          <NodeSelect
            {...this.props}
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
        <React.Fragment>
          <EntityFormHeader
            nodeDef={nodeDef}
            label={label}/>

          <EntityForm
            {...this.props}
            node={entry ? nodes[0] : null}
          />
        </React.Fragment>
      )

  }
}

const mapStateToProps = (state, props) => {
  const { nodeDef, nodes } = props

  const selectedNodeUuid = SurveyFormState.getFormPageNodeUuid(nodeDef)(state)
  const surveyForm = SurveyFormState.getSurveyForm(state)
  const record = RecordState.getRecord(surveyForm)

  const selectedNode = selectedNodeUuid && nodes
    ? R.find(R.propEq('uuid', selectedNodeUuid), nodes)
    : null

  const recordValidation = Record.getValidation(record)

  const validation = NodeDef.isEntity(nodeDef)
    ? Validator.getFieldValidation(selectedNodeUuid)(recordValidation)
    : {}

  return {
    selectedNode,
    validation,
  }
}

export default connect(
  mapStateToProps,
  { setFormPageNode, getNodeKeyLabelValues }
)(NodeDefEntityForm)