import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import NodeDefFormItem from './components/nodeDefFormItem'
import NodeDefTableHeader from './components/nodeDefTableHeader'
import NodeDefTableBody from './components/nodeDefTableBody'
import NodeDefEditFormActions from './components/nodeDefEditFormActions'
import ErrorBadge from '../../../commonComponents/errorBadge'

import Survey from '../../../../common/survey/survey'
import NodeDef from '../../../../common/survey/nodeDef'
import NodeDefValidations from '../../../../common/survey/nodeDefValidations'
import Validator from '../../../../common/validation/validator'
import Record from '../../../../common/record/record'
import RecordValidation from '../../../../common/record/recordValidation'
import Node from '../../../../common/record/node'
import Layout from '../../../../common/survey/nodeDefLayout'

import * as SurveyState from '../../../survey/surveyState'
import * as SurveyFormState from '../surveyFormState'
import * as RecordState from '../record/recordState'

import { getNodeDefDefaultValue } from './nodeDefSystemProps'

// edit actions
import { putNodeDefProp } from '../../../survey/nodeDefs/actions'
// entry actions
import { createNodePlaceholder, updateNode, removeNode } from '../record/actions'

class NodeDefSwitch extends React.Component {

  constructor (props) {
    super(props)

    this.element = React.createRef()
  }

  checkNodePlaceholder () {
    const { nodes, nodeDef, parentNode, createNodePlaceholder, canAddNode } = this.props
    const hasNotPlaceholder = R.none(Node.isPlaceholder, nodes)

    if (NodeDef.isNodeDefAttribute(nodeDef) && hasNotPlaceholder) {
      createNodePlaceholder(nodeDef, parentNode, getNodeDefDefaultValue(nodeDef))
    }
  }

  toggleErrorClass () {
    const { nodeDef } = this.props
    if (NodeDef.isNodeDefAttribute(nodeDef))
      this.element.current.classList.toggle('node-def__invalid')
  }

  componentDidMount () {
    const { nodeDef, edit, valid } = this.props

    if (edit && !nodeDef.id)
      this.element.current.scrollIntoView()

    this.checkNodePlaceholder()
    if (!valid)
      this.toggleErrorClass()
  }

  componentDidUpdate (prevProps) {
    this.checkNodePlaceholder()
    if (prevProps.valid !== this.props.valid) {
      this.toggleErrorClass()
    }
  }

  render () {
    const {
      nodeDef, validation,
      edit, canEditDef,
      renderType, label, applicable,
    } = this.props

    const isPage = !!Layout.getPageUuid(nodeDef)

    const className = 'node-def__form'
      + (isPage ? '_page' : '')
      + (applicable ? '' : ' node-def__not-applicable')

    return (
      <div className={className} ref={this.element}>

        <ErrorBadge validation={validation} showLabel={edit}/>

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
    const nodes = NodeDef.isNodeDefRoot(nodeDef)
      ? [Record.getRootNode(record)]
      : parentNode
        ? Record.getNodeChildrenByDefUuid(parentNode, NodeDef.getUuid(nodeDef))(record)
        : []

    const recordValidation = Record.getValidation(record)

    const validation = NodeDef.isNodeDefSingle(nodeDef) && !R.isEmpty(nodes)
      ? Validator.getFieldValidation(Node.getUuid(nodes[0]))(recordValidation)
      : RecordValidation.getChildrenCountValidation(parentNode, nodeDef)(recordValidation)

    const nodesValidated = nodes.map(n => {
      const nodeValidation = Validator.getFieldValidation(Node.getUuid(n))(recordValidation)
      return Node.assocValidation(nodeValidation)(n)
    })

    const maxCount = R.pipe(NodeDef.getValidations, NodeDefValidations.getMaxCount)(nodeDef)
    const canAddNode = parentNode &&
      NodeDef.isNodeDefMultiple(nodeDef) &&
      (R.isEmpty(maxCount) || R.length(nodes) < Number(maxCount))

    return {
      nodes: nodesValidated,
      validation,
      valid: Validator.isValidationValid(validation),
      canAddNode
    }
  }

  return {
    label: NodeDef.getNodeDefLabel(nodeDef, Survey.getDefaultLanguage(surveyInfo)),
    applicable: parentNode
      ? Node.isChildApplicable(NodeDef.getUuid(nodeDef))(parentNode)
      : true,
    ...entry
      ? mapEntryProps()
      : { validation: Validator.getValidation(nodeDef) },
  }
}

export default connect(
  mapStateToProps,
  {
    putNodeDefProp,
    updateNode, removeNode, createNodePlaceholder
  }
)(NodeDefSwitch)