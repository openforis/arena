import './nodeDefs.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { NodeDefFormItem } from './internal'
import { NodeDefTableCellHeader } from './internal'
import { NodeDefTableCellBody } from './internal'
import { NodeDefEditButtons } from './internal'

import NodeDef from '../../../../../core/survey/nodeDef'
import NodeDefValidations from '../../../../../core/survey/nodeDefValidations'
import Validation from '../../../../../core/validation/validation'
import Record from '../../../../../core/record/record'
import Node from '../../../../../core/record/node'
import NodeDefLayout from '../../../../../core/survey/nodeDefLayout'

import * as SurveyState from '../../../../survey/surveyState'
import * as RecordState from '../../record/recordState'

import * as NodeDefUiProps from './internal'

// edit actions
import { putNodeDefProp, putNodeDefLayoutProp } from '../../../../survey/nodeDefs/actions'
// entry actions
import { createNodePlaceholder, updateNode, removeNode } from '../../record/actions'

class _NodeDefSwitch extends React.Component {
	public element: React.RefObject<any>;

  static defaultProps = {
    // specified when can edit node definition
    canEditDef: false,
    valid: true,

    // entry default props
    nodes: [],
    canAddNode: false,
  }

  constructor (props) {
    super(props)

    this.element = React.createRef()
  }

  checkNodePlaceholder () {
    const { nodes, nodeDef, parentNode, createNodePlaceholder, canAddNode } = this.props

    if (canAddNode && NodeDef.isAttribute(nodeDef) && !NodeDef.isCode(nodeDef) && R.none(Node.isPlaceholder, nodes)) {
      createNodePlaceholder(nodeDef, parentNode, NodeDefUiProps.getDefaultValue(nodeDef))
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
      surveyCycleKey, nodeDef, label,
      edit, canEditDef,
      renderType, applicable,
    } = this.props

    const className = 'survey-form__node-def-page'
      + (NodeDefLayout.hasPage(surveyCycleKey)(nodeDef) ? '' : '-item')
      + (applicable ? '' : ' not-applicable')

    return (
      <div className={className} ref={this.element}>

        <NodeDefEditButtons
          surveyCycleKey={surveyCycleKey}
          nodeDef={nodeDef}
          edit={edit}
          canEditDef={canEditDef}
        />

        {
          renderType === NodeDefLayout.renderType.tableHeader
            ? <NodeDefTableCellHeader nodeDef={nodeDef} label={label}/>
            : renderType === NodeDefLayout.renderType.tableBody
            ? <NodeDefTableCellBody {...this.props} label={label}/>
            : <NodeDefFormItem {...this.props} label={label}/>
        }

      </div>
    )

  }
}

const mapStateToProps = (state, props) => {
  const { nodeDef, parentNode, entry, canEditRecord } = props

  const surveyInfo = SurveyState.getSurveyInfo(state)
  const record = RecordState.getRecord(state)
  const label = SurveyState.getNodeDefLabel(nodeDef)(state)

  const mapEntryProps = () => {
    const nodes = NodeDef.isRoot(nodeDef)
      ? [Record.getRootNode(record)]
      : parentNode
        ? Record.getNodeChildrenByDefUuid(parentNode, NodeDef.getUuid(nodeDef))(record)
        : []

    const nodesValidated = R.pipe(
      R.map(n =>
        Validation.assocValidation(
          R.pipe(
            Validation.getValidation,
            Validation.getFieldValidation(Node.getUuid(n)),
          )(record)
        )(n)
      )
    )(nodes)

    const maxCount = R.pipe(NodeDef.getValidations, NodeDefValidations.getMaxCount)(nodeDef)

    const canAddNode =
      canEditRecord
      && parentNode
      && NodeDef.isMultiple(nodeDef)
      && (R.isEmpty(maxCount) || R.length(nodes) < Number(maxCount))

    return {
      nodes: nodesValidated,
      canAddNode,
      readOnly: NodeDef.isReadOnly(nodeDef)
    }
  }

  return {
    surveyInfo,
    label,
    applicable: parentNode
      ? Node.isChildApplicable(NodeDef.getUuid(nodeDef))(parentNode)
      : true,
    ...entry
      ? mapEntryProps()
      : {},
  }
}

export const NodeDefSwitch = connect(
  mapStateToProps,
  {
    putNodeDefProp, putNodeDefLayoutProp,
    updateNode, removeNode, createNodePlaceholder
  }
)(_NodeDefSwitch)
export default NodeDefSwitch
