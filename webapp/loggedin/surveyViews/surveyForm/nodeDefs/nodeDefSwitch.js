import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import NodeDefFormItem from './components/nodeDefFormItem'
import NodeDefTableHeader from './components/nodeDefTableHeader'
import NodeDefTableBody from './components/nodeDefTableBody'
import NodeDefEditFormActions from './components/nodeDefEditFormActions'
import NodeDefErrorBadge from './components/nodeDefErrorBadge'

import Survey from '../../../../../common/survey/survey'
import NodeDef from '../../../../../common/survey/nodeDef'
import NodeDefValidations from '../../../../../common/survey/nodeDefValidations'
import Validator from '../../../../../common/validation/validator'
import Record from '../../../../../common/record/record'
import Node from '../../../../../common/record/node'
import Layout from '../../../../../common/survey/nodeDefLayout'

import * as SurveyState from '../../../../survey/surveyState'
import * as SurveyFormState from '../surveyFormState'
import * as RecordState from '../../record/recordState'

import { getNodeDefDefaultValue } from './nodeDefSystemProps'

// edit actions
import { putNodeDefProp } from '../../../../survey/nodeDefs/actions'
// entry actions
import { createNodePlaceholder, updateNode, removeNode } from '../../record/actions'

class NodeDefSwitch extends React.Component {

  constructor (props) {
    super(props)

    this.element = React.createRef()
  }

  checkNodePlaceholder () {
    const { nodes, nodeDef, parentNode, createNodePlaceholder, canAddNode } = this.props

    if (parentNode && canAddNode && NodeDef.isAttribute(nodeDef) && R.none(Node.isPlaceholder, nodes)) {
      createNodePlaceholder(nodeDef, parentNode, getNodeDefDefaultValue(nodeDef))
    }
  }

  componentDidMount () {
    const { nodeDef, edit } = this.props

    if (edit && !nodeDef.id)
      this.element.current.scrollIntoView()

    this.checkNodePlaceholder()
  }

  componentDidUpdate (prevProps) {
    this.checkNodePlaceholder()
  }

  render () {
    const {
      nodeDef,
      edit, canEditDef,
      renderType, label, applicable,
      parentNode, nodes
    } = this.props

    const isPage = !!Layout.getPageUuid(nodeDef)

    const className = 'node-def__form'
      + (isPage ? '_page' : '')
      + (applicable ? '' : ' node-def__not-applicable')

    return (
      <div className={className} ref={this.element}>

        <NodeDefErrorBadge nodeDef={nodeDef}
                           edit={edit}
                           parentNode={parentNode}
                           nodes={nodes}
                           container={this.element}/>

        <NodeDefEditFormActions nodeDef={nodeDef}
                                edit={edit}
                                canEditDef={canEditDef}/>

        {
          renderType === Layout.nodeDefRenderType.tableHeader
            ? <NodeDefTableHeader nodeDef={nodeDef} label={label}/>
            : renderType === Layout.nodeDefRenderType.tableBody
            ? <NodeDefTableBody {...this.props}/>
            : <NodeDefFormItem {...this.props} />
        }

      </div>
    )

  }
}

NodeDefSwitch.defaultProps = {
  // specified when can edit node definition
  canEditDef: false,
  valid: true,

  // entry default props
  nodes: [],
  canAddNode: false,
}

const mapStateToProps = (state, props) => {
  const { nodeDef, parentNode, entry } = props

  const surveyInfo = SurveyState.getStateSurveyInfo(state)
  const surveyForm = SurveyFormState.getSurveyForm(state)
  const record = RecordState.getRecord(surveyForm)

  const mapEntryProps = () => {
    const nodes = NodeDef.isRoot(nodeDef)
      ? [Record.getRootNode(record)]
      : parentNode
        ? Record.getNodeChildrenByDefUuid(parentNode, NodeDef.getUuid(nodeDef))(record)
        : []

    const nodesValidated = R.pipe(
      R.map(n =>
        Validator.assocValidation(
          R.pipe(
            Validator.getValidation,
            Validator.getFieldValidation(Node.getUuid(n)),
          )(record)
        )(n)
      )
    )(nodes)

    const maxCount = R.pipe(NodeDef.getValidations, NodeDefValidations.getMaxCount)(nodeDef)
    const canAddNode = parentNode &&
      NodeDef.isMultiple(nodeDef) &&
      (R.isEmpty(maxCount) || R.length(nodes) < Number(maxCount))

    return {
      nodes: nodesValidated,
      canAddNode,
      readOnly: NodeDef.isReadOnly(nodeDef)
    }
  }

  return {
    label: NodeDef.getLabel(nodeDef, Survey.getDefaultLanguage(surveyInfo)),
    applicable: parentNode
      ? Node.isChildApplicable(NodeDef.getUuid(nodeDef))(parentNode)
      : true,
    ...entry
      ? mapEntryProps()
      : {},
  }
}

export default connect(
  mapStateToProps,
  {
    putNodeDefProp,
    updateNode, removeNode, createNodePlaceholder
  }
)(NodeDefSwitch)