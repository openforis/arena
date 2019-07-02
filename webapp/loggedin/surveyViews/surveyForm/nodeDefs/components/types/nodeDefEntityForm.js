import './nodeDefEntityForm.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import useI18n from '../../../../../../commonComponents/useI18n'

import { Responsive, WidthProvider } from 'react-grid-layout'

import NodeDefSwitch from '../../nodeDefSwitch'
import NodeDefErrorBadge from '../nodeDefErrorBadge'

import NodeDef from '../../../../../../../common/survey/nodeDef'
import Record from '../../../../../../../common/record/record'
import Node from '../../../../../../../common/record/node'
import Validator from '../../../../../../../common/validation/validator'

import NodeDefLayout from '../../../../../../../common/survey/nodeDefLayout'

import { setFormPageNode, getNodeKeyLabelValues } from '../../../../surveyForm/actions'

import * as SurveyFormState from '../../../../surveyForm/surveyFormState'
import * as RecordState from '../../../../record/recordState'

const ResponsiveGridLayout = WidthProvider(Responsive)

const EntityFormHeader = ({ nodeDef, label }) => (
  NodeDefLayout.isRenderForm(nodeDef) && !NodeDefLayout.hasPage(nodeDef) &&
  <div className="node-def__inner-form-header">
    {label}
  </div>
)

class EntityForm extends React.Component {
  constructor (props) {
    super(props)

    this.state = { onChangeLayout: null, mounted: false }
    this.onChangeLayout = this.onChangeLayout.bind(this)
  }

  setStateOnChangeLayout (onChangeLayout) {
    const { edit, canEditDef, locked } = this.props
    if (edit && canEditDef && !locked) {
      this.setState({ onChangeLayout })
    }
  }

  componentDidMount () {
    this.setStateOnChangeLayout(this.onChangeLayout)
    // mark component mounted to enable react-grid-item css-transition after initial rendering
    setTimeout(
      () => this.setState({ mounted: true }),
      200
    )
  }

  componentWillReceiveProps (nextProps, nextContext) {
    const { nodeDef } = this.props
    const { nodeDef: nodeDefNext } = nextProps
    if (NodeDef.getUuid(nodeDef) !== NodeDef.getUuid(nodeDefNext)) {
      // disable reactGridLayout onChangeLayout when switching nodeDef page to avoid dispatching reactGridLayout.onLayoutChange
      this.setStateOnChangeLayout(null)
    }
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    const { nodeDef } = this.props
    const { nodeDef: nodeDefPrev } = prevProps

    if (NodeDef.getUuid(nodeDef) !== NodeDef.getUuid(nodeDefPrev)) {
      // enable reactGridLayout onChangeLayout when switching nodeDef page
      this.setStateOnChangeLayout(this.onChangeLayout)
    }
  }

  onChangeLayout (layout) {
    const { nodeDef, putNodeDefProp } = this.props

    if (window.innerWidth > 1200 && layout.length > 0) {
      putNodeDefProp(nodeDef, NodeDefLayout.nodeDefLayoutProps.layout, layout)
    }
  }

  render () {

    const {
      nodeDef,
      childDefs,
      edit,
      canEditDef,
      canEditRecord,
      canAddNode,
      locked,
      node,
      entry,
      recordUuid,
      surveyInfo,
    } = this.props

    const { onChangeLayout, mounted } = this.state

    const columns = NodeDefLayout.getNoColumns(nodeDef)
    const rdgLayout = NodeDefLayout.getLayout(nodeDef)
    const innerPageChildren = NodeDefLayout.filterInnerPageChildren(childDefs)

    return innerPageChildren.length > 0
      ? (
        <ResponsiveGridLayout
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          autoSize={false}
          rowHeight={edit && canEditDef ? 80 : 70}
          cols={{ lg: columns, md: columns, sm: columns, xs: 1, xxs: 1 }}
          layouts={{ lg: rdgLayout, md: rdgLayout, sm: rdgLayout }}
          containerPadding={edit && canEditDef ? [15, 40] : [15, 15]}
          margin={[5, 5]}
          onLayoutChange={onChangeLayout ? onChangeLayout : () => {}}
          isDraggable={edit && canEditDef && !locked}
          isResizable={edit && canEditDef && !locked}
          compactType={null}
          useCSSTransforms={true}
          preventCollision={true}
          className={mounted ? 'mounted' : ''}>

          {
            innerPageChildren
              .map((childDef, i) =>
                <div key={NodeDef.getUuid(childDef)} id={NodeDef.getUuid(childDef)}
                     className={NodeDef.isEntity(childDef) && NodeDefLayout.isRenderForm(childDef) ? 'node-def__inner-form' : ''}>
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
}

const NodeSelect = props => {
  const {
    nodeDef, nodes, parentNode, selectedNode, getNodeKeyLabelValues,
    updateNode, removeNode, onChange, canEditRecord, canAddNode
  } = props

  const i18n = useI18n()

  return (
    <div className="node-def-entity-form__actions">

      <select className="node-select"
              value={selectedNode ? Node.getUuid(selectedNode) : 'placeholder'}
              onChange={e => onChange(e.target.value)}
              aria-disabled={R.isEmpty(nodes)}>
        <option value='placeholder' disabled hidden={true}>{i18n.t('surveyForm.nodeDefEntityForm.select')}</option>
        {
          nodes.map(n =>
            <option key={Node.getUuid(n)}
                    value={Node.getUuid(n)}>
              {getNodeKeyLabelValues(nodeDef, n)}
            </option>
          )
        }
      </select>

      {
        canEditRecord &&
        <React.Fragment>
          <button className="btn btn-s"
                  style={{ marginLeft: '5px' }}
                  aria-disabled={!selectedNode}
                  onClick={() => {
                    if (window.confirm(i18n.t('surveyForm.nodeDefEntityForm.confirmDelete'))) {
                      onChange(null)
                      removeNode(nodeDef, selectedNode)
                    }
                  }}>
            <span className="icon icon-bin icon-12px icon-left"/>
            {i18n.t('common.delete')}
          </button>
          <button className="btn btn-s"
                  style={{ marginLeft: '50px' }}
                  onClick={() => {
                    const entity = Node.newNode(NodeDef.getUuid(nodeDef), Node.getRecordUuid(parentNode), parentNode)
                    updateNode(nodeDef, entity)
                    onChange(Node.getUuid(entity))
                  }}
                  aria-disabled={!canAddNode}>
            <span className="icon icon-plus icon-12px icon-left"/>
            {i18n.t('common.add')}
          </button>
        </React.Fragment>
      }
    </div>
  )
}

class NodeDefEntityForm extends React.Component {

  constructor (props) {
    super(props)

    this.formWrapper = React.createRef()
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
  const record = RecordState.getRecord(state)

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