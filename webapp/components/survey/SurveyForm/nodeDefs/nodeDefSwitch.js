import './nodeDefs.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Validation from '@core/validation/validation'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { SurveyState } from '@webapp/store/survey'
import { RecordActions, RecordState } from '@webapp/store/ui/record'

import * as NodeDefUiProps from './nodeDefUIProps'

import { SurveyFormState } from '@webapp/store/ui/surveyForm'
import { TestId } from '@webapp/utils/testId'

// Edit actions
// Entry actions
import NodeDefEditButtons from './components/nodeDefEditButtons'
import NodeDefTableCellBody from './components/nodeDefTableCellBody'
import NodeDefTableCellHeader from './components/nodeDefTableCellHeader'
import NodeDefFormItem from './components/NodeDefFormItem'

class NodeDefSwitch extends React.Component {
  constructor(props) {
    super(props)

    this.element = React.createRef()

    this.state = {
      isHovering: false,
    }

    this.onMouseEnter = this.onMouseEnter.bind(this)
    this.onMouseLeave = this.onMouseLeave.bind(this)
  }

  checkNodePlaceholder() {
    const { nodes, nodeDef, parentNode, createNodePlaceholder, canAddNode } = this.props

    if (canAddNode && NodeDef.isAttribute(nodeDef) && !NodeDef.isCode(nodeDef) && R.none(Node.isPlaceholder, nodes)) {
      createNodePlaceholder(nodeDef, parentNode, NodeDefUiProps.getDefaultValue(nodeDef))
    }
  }

  componentDidMount() {
    const { nodeDef, edit } = this.props

    if (edit && !nodeDef.id) {
      this.element.current.scrollIntoView()
    }

    this.checkNodePlaceholder()
  }

  componentDidUpdate() {
    this.checkNodePlaceholder()
  }

  onMouseEnter() {
    this.setIsHovering(true)
  }

  onMouseLeave() {
    this.setIsHovering(false)
  }

  setIsHovering(isHovering) {
    const { edit, canEditDef } = this.props

    if (edit && canEditDef) {
      this.setState({ isHovering })
    }
  }

  render() {
    const { surveyCycleKey, nodeDef, label, lang, edit, canEditDef, renderType, applicable } = this.props
    const { isHovering } = this.state

    const renderAsForm = NodeDefLayout.isRenderForm(surveyCycleKey)(nodeDef)
    const editButtonsVisible = edit && canEditDef && (renderAsForm || isHovering)

    const className =
      'survey-form__node-def-page' +
      (NodeDefLayout.hasPage(surveyCycleKey)(nodeDef) ? '' : '-item') +
      (applicable ? '' : ' not-applicable') +
      (!applicable &&
      NodeDefLayout.isHiddenWhenNotRelevant(surveyCycleKey)(nodeDef) &&
      renderType !== NodeDefLayout.renderType.tableBody
        ? ' hidden'
        : '') +
      (NodeDef.isReadOnly(nodeDef) && renderType !== NodeDefLayout.renderType.tableHeader ? ' read-only' : '')

    return (
      <div
        className={className}
        data-testid={TestId.surveyForm.nodeDefWrapper(NodeDef.getName(nodeDef))}
        ref={this.element}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
        onMouseMove={this.onMouseEnter}
      >
        {editButtonsVisible && (
          <NodeDefEditButtons surveyCycleKey={surveyCycleKey} nodeDef={nodeDef} edit={edit} canEditDef={canEditDef} />
        )}
        {renderType === NodeDefLayout.renderType.tableHeader ? (
          <NodeDefTableCellHeader nodeDef={nodeDef} label={label} lang={lang} />
        ) : renderType === NodeDefLayout.renderType.tableBody ? (
          <NodeDefTableCellBody {...this.props} label={label} />
        ) : (
          <NodeDefFormItem {...this.props} label={label} />
        )}
      </div>
    )
  }
}

NodeDefSwitch.defaultProps = {
  // Specified when can edit node definition
  canEditDef: false,
  valid: true,

  // Entry default props
  nodes: [],
  canAddNode: false,
}

const mapStateToProps = (state, props) => {
  const { nodeDef, parentNode, entry, canEditRecord } = props

  const surveyInfo = SurveyState.getSurveyInfo(state)
  const record = RecordState.getRecord(state)
  const nodeDefLabelType = SurveyFormState.getNodeDefLabelType(state)
  const lang = SurveyState.getSurveyPreferredLang(state)
  const label = NodeDef.getLabelWithType({ nodeDef, lang, type: nodeDefLabelType })

  const mapEntryProps = () => {
    const nodes = NodeDef.isRoot(nodeDef)
      ? [Record.getRootNode(record)]
      : parentNode
      ? Record.getNodeChildrenByDefUuid(parentNode, NodeDef.getUuid(nodeDef))(record)
      : []

    const nodesValidated = R.pipe(
      R.map((n) =>
        Validation.assocValidation(
          R.pipe(Validation.getValidation, Validation.getFieldValidation(Node.getUuid(n)))(record)
        )(n)
      )
    )(nodes)

    const maxCount = R.pipe(NodeDef.getValidations, NodeDefValidations.getMaxCount)(nodeDef)

    const canAddNode =
      canEditRecord &&
      parentNode &&
      NodeDef.isMultiple(nodeDef) &&
      (R.isEmpty(maxCount) || R.length(nodes) < Number(maxCount))

    return {
      nodes: nodesValidated,
      canAddNode,
      readOnly: NodeDef.isReadOnlyOrAnalysis(nodeDef),
    }
  }

  return {
    surveyInfo,
    label,
    lang,
    applicable: parentNode ? Node.isChildApplicable(NodeDef.getUuid(nodeDef))(parentNode) : true,
    ...(entry && record ? mapEntryProps() : {}),
  }
}

export default connect(mapStateToProps, {
  updateNode: RecordActions.updateNode,
  removeNode: RecordActions.removeNode,
  createNodePlaceholder: RecordActions.createNodePlaceholder,
})(NodeDefSwitch)
